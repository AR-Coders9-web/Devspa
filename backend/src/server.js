require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require("node:crypto");
const http = require("http");
const createTerminalWebSocket = require("./terminal/terminalWebSocket");
const { getWorkspacePath } = require("./services/githubImportService");

// Existing DEVSPA routes — KEEP THESE
const githubAuthRoutes = require("./routes/githubAuthRoutes");
const githubImportRoutes = require("./routes/githubImportRoutes");
const aiDebuggerRoutes = require("./routes/aiDebuggerRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const app = express();

const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES || 500000);
const GITHUB_API = "https://api.github.com";

// Explorer workspaces live in memory for this running server.
const explorerWorkspaces = new Map();

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false }));

// =====================================================
// TRUST PROXY
// =====================================================

app.set("trust proxy", 1);

// =====================================================
// SESSION
// =====================================================

app.use(
  session({
    name: "devspa.sid",
    secret:
      process.env.SESSION_SECRET ||
      "devspa-development-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "DEVSPA backend is running 🚀",
  });
});

// =====================================================
// EXISTING DEVSPA ROUTES — DO NOT REMOVE
// =====================================================

app.use("/api/github", githubImportRoutes);
app.use("/auth", githubAuthRoutes);
app.use("/api/ai/debugger", aiDebuggerRoutes);
app.use("/api/assistant", assistantRoutes);

// =====================================================
// EXPLORER HELPERS
// =====================================================

function explorerFail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: message,
  });
}

function parseRepository(input) {
  const value = String(input || "").trim().replace(/\/+$/, "");

  const match =
    value.match(
      /github\.com[/:]([^/]+)\/([^/#?]+?)(?:\.git)?$/i
    ) ||
    value.match(/^([^/]+)\/([^/]+)$/);

  if (!match) {
    throw new Error(
      "Use a GitHub URL like https://github.com/owner/repository or owner/repository."
    );
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

function getGithubAccessToken(req) {
  // Preferred: token created by the user's GitHub OAuth login.
  const sessionToken =
    req.session?.githubAccessToken ||
    req.session?.github?.accessToken ||
    req.session?.accessToken;

  // Development fallback: the GITHUB_TOKEN in .env.
  return sessionToken || process.env.GITHUB_TOKEN || null;
}

async function githubRequest(req, path, options = {}) {
  const token = getGithubAccessToken(req);

  if (!token) {
    throw new Error(
      "GitHub authentication is required. Login with GitHub or configure GITHUB_TOKEN."
    );
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DEVSPA-Explorer",
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body?.message ||
        `GitHub request failed (${response.status})`
    );
  }

  return body;
}

function decodeGithubBlob(encoded) {
  return Buffer.from(
    String(encoded || "").replace(/\n/g, ""),
    "base64"
  ).toString("utf8");
}

function explorerPayload(workspace) {
  return {
    id: workspace.id,
    repository: workspace.repository,
    files: [...workspace.files.values()].map(
      ({
        path,
        name,
        type,
        content,
        sha,
        size,
        status,
        skipped,
      }) => ({
        path,
        name,
        type,
        content,
        sha,
        size,
        status,
        skipped: Boolean(skipped),
      })
    ),
    changedFiles: [...workspace.files.values()]
      .filter((file) => file.status === "modified")
      .map((file) => file.path),
  };
}

// =====================================================
// EXPLORER: IMPORT REPOSITORY
// =====================================================

async function importExplorerWorkspace(req, repository) {
  const { owner, repo } = parseRepository(repository);

  const meta = await githubRequest(
    req,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  );

  const branch = meta.default_branch || "main";

  const ref = await githubRequest(
    req,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branch)}`
  );

  const commitSha = ref.object?.sha;

  if (!commitSha) {
    throw new Error("Unable to resolve the repository branch.");
  }

  const commit = await githubRequest(
    req,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${commitSha}`
  );

  const treeSha = commit.tree?.sha;

  if (!treeSha) {
    throw new Error("Unable to resolve the repository tree.");
  }

  const tree = await githubRequest(
    req,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${treeSha}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error(
      "GitHub returned a truncated tree. This repository is too large for a single import."
    );
  }

  const entries = (tree.tree || []).filter(
    (item) => item.type === "blob"
  );

  const files = new Map();

  for (const entry of entries) {
    const size = Number(entry.size || 0);

    if (size > MAX_FILE_BYTES) {
      files.set(entry.path, {
        path: entry.path,
        name: entry.path.split("/").pop(),
        type: "file",
        content: "",
        sha: entry.sha,
        size,
        status: null,
        skipped: true,
      });
      continue;
    }

    const blob = await githubRequest(
      req,
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs/${entry.sha}`
    );

    files.set(entry.path, {
      path: entry.path,
      name: entry.path.split("/").pop(),
      type: "file",
      content:
        blob.encoding === "base64"
          ? decodeGithubBlob(blob.content)
          : String(blob.content || ""),
      sha: entry.sha,
      size,
      status: null,
      skipped: false,
    });
  }

  const id = crypto.randomUUID();

  const workspace = {
    id,
    owner,
    repo,
    branch,
    baseCommitSha: commitSha,
    repository: {
      id: meta.id,
      name: meta.name,
      fullName: meta.full_name,
      defaultBranch: branch,
      private: Boolean(meta.private),
      htmlUrl: meta.html_url,
    },
    files,
  };

  explorerWorkspaces.set(id, workspace);

  return workspace;
}

// =====================================================
// EXPLORER: HEALTH
// =====================================================

app.get("/api/explorer/health", (req, res) => {
  res.json({
    success: true,
    service: "devspa-explorer",
    githubConfigured: Boolean(
      getGithubAccessToken(req)
    ),
    authenticated:
      Boolean(req.session?.githubAccessToken),
    workspaces: explorerWorkspaces.size,
  });
});

// =====================================================
// EXPLORER: IMPORT
// =====================================================

app.post("/api/explorer/workspaces/import", async (req, res) => {
  try {
    const repository = req.body?.repository || req.body?.repoUrl;

    if (!repository) {
      return explorerFail(
        res,
        400,
        "GitHub repository URL is required."
      );
    }

    const workspace = await importExplorerWorkspace(
      req,
      repository
    );

    return res.status(201).json({
      success: true,
      workspace: explorerPayload(workspace),
    });
  } catch (error) {
    console.error("Explorer import error:", error);

    return explorerFail(
      res,
      400,
      error?.message || "Failed to import repository."
    );
  }
});

// =====================================================
// EXPLORER: GET WORKSPACE
// =====================================================

app.get("/api/explorer/workspaces/:id", (req, res) => {
  const workspace = explorerWorkspaces.get(req.params.id);

  if (!workspace) {
    return explorerFail(
      res,
      404,
      "Workspace not found. Import the repository again."
    );
  }

  return res.json({
    success: true,
    workspace: explorerPayload(workspace),
  });
});

// =====================================================
// EXPLORER: GET FILE
// =====================================================

app.get(
  "/api/explorer/workspaces/:id/file",
  (req, res) => {
    const workspace = explorerWorkspaces.get(
      req.params.id
    );

    if (!workspace) {
      return explorerFail(
        res,
        404,
        "Workspace not found."
      );
    }

    const filePath = String(
      req.query.path || ""
    );

    const file = workspace.files.get(filePath);

    if (!file) {
      return explorerFail(
        res,
        404,
        "File not found."
      );
    }

    return res.json({
      success: true,
      file,
    });
  }
);

// =====================================================
// EXPLORER: UPDATE FILE
// =====================================================

app.put(
  "/api/explorer/workspaces/:id/files",
  (req, res) => {
    const workspace = explorerWorkspaces.get(
      req.params.id
    );

    if (!workspace) {
      return explorerFail(
        res,
        404,
        "Workspace not found."
      );
    }

    const filePath = String(
      req.body?.path || ""
    ).trim();

    if (
      !filePath ||
      filePath.includes("..") ||
      filePath.startsWith("/")
    ) {
      return explorerFail(
        res,
        400,
        "Invalid file path."
      );
    }

    const file = workspace.files.get(filePath);

    if (!file) {
      return explorerFail(
        res,
        404,
        "File not found."
      );
    }

    const content = String(
      req.body?.content ?? ""
    );

    if (
      Buffer.byteLength(content, "utf8") >
      MAX_FILE_BYTES
    ) {
      return explorerFail(
        res,
        413,
        "File is too large."
      );
    }

    file.content = content;
    file.status = "modified";

    workspace.files.set(filePath, file);

    return res.json({
      success: true,
      file,
    });
  }
);

// =====================================================
// EXPLORER: COMMIT CHANGED FILES
// =====================================================

app.post(
  "/api/explorer/workspaces/:id/commit",
  async (req, res) => {
    const workspace = explorerWorkspaces.get(
      req.params.id
    );

    if (!workspace) {
      return explorerFail(
        res,
        404,
        "Workspace not found."
      );
    }

    const changed = [
      ...workspace.files.values(),
    ].filter(
      (file) =>
        file.status === "modified" &&
        !file.skipped
    );

    if (!changed.length) {
      return explorerFail(
        res,
        400,
        "There are no edited files to commit."
      );
    }

    const message =
      String(
        req.body?.message ||
          "Update files via DEVSPA Explorer"
      ).trim().slice(0, 200);

    try {
      const currentRef = await githubRequest(
        req,
        `/repos/${workspace.owner}/${workspace.repo}/git/ref/heads/${encodeURIComponent(workspace.branch)}`
      );

      const parentSha =
        currentRef.object?.sha;

      if (!parentSha) {
        throw new Error(
          "Unable to resolve the current branch."
        );
      }

      const parentCommit =
        await githubRequest(
          req,
          `/repos/${workspace.owner}/${workspace.repo}/git/commits/${parentSha}`
        );

      const rootTreeSha =
        parentCommit.tree?.sha;

      if (!rootTreeSha) {
        throw new Error(
          "Unable to resolve the current repository tree."
        );
      }

      const treeEntries = [];

      for (const file of changed) {
        const blob = await githubRequest(
          req,
          `/repos/${workspace.owner}/${workspace.repo}/git/blobs`,
          {
            method: "POST",
            body: JSON.stringify({
              content: file.content,
              encoding: "utf-8",
            }),
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

        treeEntries.push({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      }

      const tree = await githubRequest(
        req,
        `/repos/${workspace.owner}/${workspace.repo}/git/trees`,
        {
          method: "POST",
          body: JSON.stringify({
            base_tree: rootTreeSha,
            tree: treeEntries,
          }),
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const commit =
        await githubRequest(
          req,
          `/repos/${workspace.owner}/${workspace.repo}/git/commits`,
          {
            method: "POST",
            body: JSON.stringify({
              message,
              tree: tree.sha,
              parents: [parentSha],
            }),
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      await githubRequest(
        req,
        `/repos/${workspace.owner}/${workspace.repo}/git/refs/heads/${encodeURIComponent(workspace.branch)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            sha: commit.sha,
            force: false,
          }),
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      workspace.baseCommitSha = commit.sha;

      changed.forEach((file) => {
        file.status = null;
      });

      return res.json({
        success: true,
        commit: {
          sha: commit.sha,
          url: commit.html_url,
          message,
        },
        workspace:
          explorerPayload(workspace),
      });
    } catch (error) {
      console.error(
        "Explorer commit error:",
        error
      );

      return explorerFail(
        res,
        409,
        `Commit failed: ${
          error?.message || "Unknown GitHub error."
        }`
      );
    }
  }
);

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found.",
    path: req.originalUrl,
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((error, _req, res, _next) => {
  console.error(
    "Unhandled backend error:",
    error
  );

  if (res.headersSent) return;

  return res.status(500).json({
    success: false,
    message:
      error?.message ||
      "Internal server error.",
  });
});

// =====================================================
// START
// =====================================================

// =====================================================
// HTTP + TERMINAL WEBSOCKET SERVER
// =====================================================

const httpServer = http.createServer(app);

createTerminalWebSocket({
  server: httpServer,

  // Resolve each terminal to its imported DEVSPA workspace.
  // Keep the backend root only as a safe fallback when no workspace is provided.
  getWorkspace: (workspaceId) => {
    if (!workspaceId) {
      return process.cwd();
    }

    return getWorkspacePath(workspaceId);
  },
});

httpServer.listen(PORT, () => {
  console.log(
    `DEVSPA backend running on http://localhost:${PORT}`
  );

  console.log(
    `DEVSPA terminal WebSocket running on ws://localhost:${PORT}/api/terminal/ws`
  );
});
