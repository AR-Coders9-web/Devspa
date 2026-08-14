const path = require("path");
const fs = require("fs/promises");

const {
  importRepository,
  saveWorkspaceFiles,
  readWorkspaceFile,
  deleteWorkspaceFile: deleteWorkspaceFileFromDisk,
  commitRepository,
  getWorkspaceSnapshot,
  sanitizeWorkspaceId,
  getWorkspacePath,
} = require("../services/githubImportService");

const {
  destroyTerminalsForWorkspace,
} = require("../terminal/terminalManager");

const {
  createInstallationToken,
  getRepositoryInstallation,
} = require("../services/githubAppService");

/* =========================================================
   HELPERS
========================================================= */

const parseGithubRepositoryUrl = (
  repoUrl
) => {
  try {
    const url = new URL(
      String(repoUrl || "").trim()
    );

    if (
      url.hostname.toLowerCase() !==
      "github.com"
    ) {
      throw new Error();
    }

    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);

    if (parts.length < 2) {
      throw new Error();
    }

    return {
      owner: parts[0],
      repo: parts[1].replace(
        /\.git$/i,
        ""
      ),
    };
  } catch {
    const error = new Error(
      "Invalid GitHub repository URL."
    );

    error.status = 400;

    throw error;
  }
};

/**
 * Resolve a fresh GitHub App installation token
 * for the exact repository being accessed.
 *
 * IMPORTANT:
 * This does NOT depend on req.session.
 *
 * Therefore:
 * - nodemon restart is safe
 * - backend restart is safe
 * - session loss is safe
 */
const getAccessToken = async (
  req,
  repoUrl,
  options = {}
) => {
  const {
    required = false,
  } = options;

  const {
    owner,
    repo,
  } = parseGithubRepositoryUrl(repoUrl);

  /*
   * 1. First priority:
   *    Existing GitHub App installation
   */
  try {
    const installation =
      await getRepositoryInstallation(
        owner,
        repo
      );

    if (!installation?.id) {
      throw new Error(
        "GitHub App installation ID was not returned."
      );
    }

    /*
     * Keep session information only as a UI convenience.
     */
    if (req?.session) {
      req.session.githubInstallationId =
        installation.id;

      if (installation.account) {
        req.session.user = {
          id:
            installation.account.id,

          login:
            installation.account.login ||
            installation.account.name ||
            null,

          name:
            installation.account.name ||
            installation.account.login ||
            null,

          avatarUrl:
            installation.account.avatar_url ||
            null,

          githubUrl:
            installation.account.html_url ||
            null,
        };
      }
    }

    const result =
      await createInstallationToken(
        installation.id
      );

    return result.token;

  } catch (error) {

    /*
     * 2. If GitHub App is not installed,
     *    use GITHUB_TOKEN from .env.
     */
    if (process.env.GITHUB_TOKEN) {
      return process.env.GITHUB_TOKEN;
    }

    /*
     * 3. Public repositories can work
     *    without authentication.
     */
    if (
      error?.status === 404 &&
      !required
    ) {
      return null;
    }

    /*
     * 4. Required authentication but
     *    GitHub App is not connected.
     */
    if (error?.status === 404) {
      const authError =
        new Error(
          "GitHub authentication is required. Please configure GITHUB_TOKEN or connect the GitHub App."
        );

      authError.status = 401;

      throw authError;
    }

    throw error;
  }
};

/* =========================================================
   IMPORT REPOSITORY
========================================================= */

const importGithubRepository =
  async (req, res) => {
    try {
      const repoUrl = String(
        req.body?.repoUrl || ""
      ).trim();

      if (!repoUrl) {
        return res.status(400).json({
          success: false,
          message:
            "GitHub repository URL is required.",
        });
      }

      console.log(
        "GitHub repository import requested:",
        repoUrl
      );

      /*
       * Public repositories can work without
       * an installation.
       *
       * Private repositories automatically use
       * the GitHub App installation token.
       */
      const accessToken =
        await getAccessToken(
          req,
          repoUrl,
          {
            required: false,
          }
        );

      const result =
        await importRepository(
          repoUrl,
          accessToken
        );

      console.log(
        `Imported ${
          result.importedFiles
        } files from ${
          result.repository.fullName
        }`
      );

      return res.json({
        success: true,
        message:
          "GitHub repository imported successfully.",
        ...result,
      });
    } catch (error) {
      console.error(
        "GitHub repository import error:",
        error
      );

      let status =
        error?.status || 500;

      if (
        /rate limit/i.test(
          error?.message || ""
        )
      ) {
        status = 429;
      }

      if (
        status === 404
      ) {
        status = 404;
      }

      return res.status(status).json({
        success: false,
        message:
          error?.message ||
          "Failed to import GitHub repository.",
      });
    }
  };

/* =========================================================
   GET WORKSPACE SNAPSHOT
========================================================= */

const getGithubWorkspace = async (req, res) => {
  try {
    const workspaceId = sanitizeWorkspaceId(req.params.workspaceId);

    if (!workspaceId || workspaceId === 'default') {
      return res.status(400).json({
        success: false,
        message: 'A valid workspace ID is required.',
      });
    }

    const result = await getWorkspaceSnapshot(workspaceId);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get GitHub workspace error:', error);

    return res.status(404).json({
      success: false,
      message: error?.message || 'Workspace not found.',
    });
  }
};

/* =========================================================
   CLEAR WORKSPACE
   NO GITHUB AUTHENTICATION HERE
========================================================= */

const clearGithubWorkspace =
  async (req, res) => {
    try {
      const rawWorkspaceId =
        req.body?.workspaceId ||
        req.query?.workspaceId;

      const workspaceId =
        sanitizeWorkspaceId(
          rawWorkspaceId
        );

      if (
        !workspaceId ||
        workspaceId === "default"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid workspace ID is required.",
        });
      }

      const workspacePath =
        getWorkspacePath(
          workspaceId
        );

      const root =
        path.resolve(
          path.dirname(
            workspacePath
          )
        );

      /*
       * Security check:
       * workspace MUST remain inside
       * the workspace root.
       */
      if (
        workspacePath === root ||
        !workspacePath.startsWith(
          `${root}${path.sep}`
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workspace.",
        });
      }

      /*
       * Stop terminal processes BEFORE
       * deleting the workspace.
       */
   // Stop terminal processes BEFORE
// deleting the workspace.
await destroyTerminalsForWorkspace(
  workspacePath
);

// Windows may need a little time to
// release terminal/process file handles.
await new Promise((resolve) =>
  setTimeout(resolve, 300)
);

await fs.rm(
  workspacePath,
  {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 500,
  }
);
      return res.json({
        success: true,
        workspaceId,
        message:
          "Workspace cleared successfully.",
      });
    } catch (error) {
      console.error(
        "Workspace clear error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Failed to clear workspace.",
      });
    }
  };

/* =========================================================
   SAVE WORKSPACE
========================================================= */

const saveWorkspace =
  async (req, res) => {
    try {
      const workspaceId =
        sanitizeWorkspaceId(
          req.body?.workspaceId
        );

      const files =
        Array.isArray(
          req.body?.files
        )
          ? req.body.files
          : [];

      if (
        !workspaceId ||
        workspaceId === "default"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid workspace ID is required.",
        });
      }

      const result =
        await saveWorkspaceFiles(
          workspaceId,
          files
        );

      return res.json({
        success: true,
        message:
          "Workspace saved.",
        ...result,
      });
    } catch (error) {
      console.error(
        "Workspace save error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Failed to save workspace.",
      });
    }
  };

/* =========================================================
   READ WORKSPACE FILE
========================================================= */

const getWorkspaceFile =
  async (req, res) => {
    try {
      const workspaceId =
        sanitizeWorkspaceId(
          req.params.workspaceId
        );

      const relativePath =
        String(
          req.query.path || ""
        );

      if (
        !workspaceId ||
        workspaceId === "default" ||
        !relativePath
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workspace and file path are required.",
        });
      }

      const buffer =
        await readWorkspaceFile(
          workspaceId,
          relativePath
        );

      const extension =
        path.extname(
          relativePath
        ).toLowerCase();

      const mimeByExtension = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".bmp": "image/bmp",
        ".avif": "image/avif",

        ".html":
          "text/html; charset=utf-8",
        ".css":
          "text/css; charset=utf-8",
        ".js":
          "text/javascript; charset=utf-8",
        ".jsx":
          "text/javascript; charset=utf-8",
        ".mjs":
          "text/javascript; charset=utf-8",
        ".ts":
          "text/plain; charset=utf-8",
        ".tsx":
          "text/plain; charset=utf-8",

        ".json":
          "application/json; charset=utf-8",
        ".md":
          "text/markdown; charset=utf-8",
        ".txt":
          "text/plain; charset=utf-8",
        ".xml":
          "application/xml; charset=utf-8",
      };

      res.setHeader(
        "Cache-Control",
        "private, max-age=300"
      );

      res.type(
        mimeByExtension[
          extension
        ] ||
          "application/octet-stream"
      );

      return res.send(buffer);
    } catch (error) {
      console.error(
        "Workspace file read error:",
        error
      );

      const status =
        /Invalid workspace file path/i.test(
          error?.message || ""
        )
          ? 400
          : 404;

      return res.status(status).json({
        success: false,
        message:
          error?.message ||
          "File not found.",
      });
    }
  };

/* =========================================================
   DELETE WORKSPACE FILE
========================================================= */

const deleteWorkspaceFile = async (req, res) => {
  try {
    const workspaceId = sanitizeWorkspaceId(req.params.workspaceId);
    const relativePath = String(req.query.path || "").trim();

    if (!workspaceId || workspaceId === "default") {
      return res.status(400).json({
        success: false,
        message: "A valid workspace ID is required.",
      });
    }

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        message: "A file path is required.",
      });
    }

    const result = await deleteWorkspaceFileFromDisk(
      workspaceId,
      relativePath
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Workspace file delete error:", error);

    const message = error?.message || "Failed to delete workspace file.";
    const status = /not found/i.test(message) ? 404 : /Invalid workspace file path/i.test(message) ? 400 : 500;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

/* =========================================================
   COMMIT & PUSH
========================================================= */

const commitGithubRepository =
  async (req, res) => {
    try {
      const repoUrl = String(
        req.body?.repoUrl || ""
      ).trim();

      const message = String(
        req.body?.message || ""
      ).trim();

      const files =
        Array.isArray(
          req.body?.files
        )
          ? req.body.files
          : [];

      const branch = String(
        req.body?.branch || ""
      ).trim();

      if (!repoUrl) {
        return res.status(400).json({
          success: false,
          message:
            "GitHub repository URL is required.",
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          message:
            "Commit message is required.",
        });
      }

      if (!files.length) {
        return res.status(400).json({
          success: false,
          message:
            "No modified files to commit.",
        });
      }

      /*
       * Commit ALWAYS requires the GitHub App.
       * No OAuth/session token dependency.
       */
      const accessToken =
        await getAccessToken(
          req,
          repoUrl,
          {
            required: true,
          }
        );

      const result =
        await commitRepository(
          repoUrl,
          {
            branch:
              branch || undefined,
            message,
            files,
          },
          accessToken
        );

      return res.json({
        success: true,
        message:
          `Committed and pushed ${
            result.filesCommitted
          } file${
            result.filesCommitted === 1
              ? ""
              : "s"
          }.`,
        ...result,
      });
    } catch (error) {
      console.error(
        "GitHub commit error:",
        error
      );

      let status =
        error?.status || 500;

      if (
        /rate limit/i.test(
          error?.message || ""
        )
      ) {
        status = 429;
      }

      if (
        /GitHub App is not installed/i.test(
          error?.message || ""
        )
      ) {
        status = 401;
      }

      if (
        error?.status === 409
      ) {
        status = 409;
      }

      return res.status(status).json({
        success: false,
        message:
          error?.message ||
          "Commit & Push failed.",
      });
    }
  };

module.exports = {
  importGithubRepository,
  getGithubWorkspace,
  clearGithubWorkspace,
  saveWorkspace,
  getWorkspaceFile,
  deleteWorkspaceFile,
  commitGithubRepository,
};