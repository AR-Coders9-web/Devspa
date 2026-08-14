const fs = require("fs/promises");
const path = require("path");

const {
  getWorkspacePath,
  sanitizeWorkspaceId,
} = require("./githubImportService");

const MAX_FILES = 40;
const MAX_FILE_BYTES = 120 * 1024;
const MAX_TOTAL_BYTES = 900 * 1024;

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".html",
  ".htm",
  ".md",
  ".txt",
  ".mjs",
  ".cjs",
  ".vue",
  ".py",
  ".java",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".go",
  ".rs",
  ".php",
  ".xml",
  ".yml",
  ".yaml",
  ".toml",
  ".sql",
  ".sh",
  ".bat",
  ".ps1",
]);

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".vite",
  ".cache",
  ".turbo",
]);

const isTextFile = (filePath) => {
  const ext = path.extname(String(filePath || "")).toLowerCase();

  // Handle dot-files separately.
  const base = path.basename(String(filePath || "")).toLowerCase();

  if (
    base === ".gitignore" ||
    base === ".npmrc" ||
    base === ".prettierrc" ||
    base === ".eslintrc" ||
    base === ".env.example"
  ) {
    return true;
  }

  return TEXT_EXTENSIONS.has(ext);
};

const safeRelative = (value) => {
  if (typeof value !== "string") return null;

  const raw = value.trim();

  if (!raw) return null;

  const normalized = path
    .normalize(raw.replace(/\\/g, "/"))
    .replace(/\\/g, "/");

  if (
    !normalized ||
    normalized === "." ||
    normalized.startsWith("/") ||
    path.isAbsolute(normalized) ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    return null;
  }

  return normalized;
};

const collectFiles = async (
  root,
  current = root,
  result = []
) => {
  if (result.length >= MAX_FILES) {
    return result;
  }

  let entries;

  try {
    entries = await fs.readdir(current, {
      withFileTypes: true,
    });
  } catch (error) {
    console.error(
      "[WorkspaceContext] Failed to read directory:",
      current,
      error.message
    );

    return result;
  }

  for (const entry of entries) {
    if (result.length >= MAX_FILES) {
      break;
    }

    const name = entry.name;

    // Ignore most hidden files, but keep useful project config files.
    if (
      name.startsWith(".") &&
      ![
        ".gitignore",
        ".env.example",
        ".npmrc",
        ".prettierrc",
        ".eslintrc",
      ].includes(name)
    ) {
      continue;
    }

    if (
      entry.isDirectory() &&
      IGNORED_DIRS.has(name)
    ) {
      continue;
    }

    const absolute = path.join(current, name);

    if (entry.isDirectory()) {
      await collectFiles(
        root,
        absolute,
        result
      );

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!isTextFile(absolute)) {
      continue;
    }

    try {
      const stat = await fs.stat(absolute);

      if (stat.size > MAX_FILE_BYTES) {
        continue;
      }

      const relative = path
        .relative(root, absolute)
        .replace(/\\/g, "/");

      result.push({
        absolute,
        relative,
        size: stat.size,
      });
    } catch {
      // Ignore files that disappear during scanning.
    }
  }

  return result;
};

/**
 * Convert frontend file descriptors into safe paths.
 *
 * Supports:
 *
 * "src/App.jsx"
 *
 * {
 *   path: "src/App.jsx",
 *   content: "..."
 * }
 */
const normalizeRequestedFiles = (files) => {
  if (!Array.isArray(files)) {
    return [];
  }

  const result = [];

  for (const file of files) {
    let candidate = null;

    if (typeof file === "string") {
      candidate = file;
    } else if (
      file &&
      typeof file === "object"
    ) {
      candidate =
        file.path ||
        file.relativePath ||
        file.name ||
        null;
    }

    const safe = safeRelative(candidate);

    if (safe) {
      result.push(safe);
    }
  }

  return [...new Set(result)].slice(
    0,
    MAX_FILES
  );
};

/**
 * Build repository context for Gemini.
 *
 * Priority:
 *
 * 1. File content supplied by frontend
 * 2. File content loaded from workspace disk
 * 3. Full workspace scan
 */
const buildWorkspaceContext = async ({
  workspaceId,
  files = [],
  currentFile = "",
}) => {
  const cleanId =
    sanitizeWorkspaceId(workspaceId);

  if (
    !cleanId ||
    cleanId === "default"
  ) {
    throw Object.assign(
      new Error(
        "A valid workspace ID is required."
      ),
      { status: 400 }
    );
  }

  const workspacePath = path.resolve(
    getWorkspacePath(cleanId)
  );

  /*
   * Make sure the workspace actually exists.
   */
  try {
    const workspaceStat =
      await fs.stat(workspacePath);

    if (!workspaceStat.isDirectory()) {
      throw new Error(
        "Workspace path is not a directory."
      );
    }
  } catch (error) {
    console.error(
      "[WorkspaceContext] Workspace not found:",
      workspacePath
    );

    throw Object.assign(
      new Error(
        `Workspace files could not be loaded. Workspace "${cleanId}" does not exist on the backend.`
      ),
      { status: 404 }
    );
  }

  /*
   * ---------------------------------------------------------
   * FRONTEND PROVIDED FILES
   * ---------------------------------------------------------
   *
   * Preserve actual content if frontend already has it.
   */
  const suppliedFiles = new Map();

  if (Array.isArray(files)) {
    for (const file of files) {
      if (
        !file ||
        typeof file !== "object"
      ) {
        continue;
      }

      const safePath = safeRelative(
        file.path ||
          file.relativePath ||
          file.name
      );

      if (!safePath) {
        continue;
      }

      if (
        typeof file.content === "string"
      ) {
        suppliedFiles.set(
          safePath,
          {
            path: safePath,
            content: file.content,
            truncated:
              file.truncated === true,
          }
        );
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * REQUESTED PATHS
   * ---------------------------------------------------------
   */
  const requestedPaths =
    normalizeRequestedFiles(files);

  /*
   * If frontend supplied actual content,
   * use those files first.
   */
  const contextFiles = [];
  let totalBytes = 0;

  const addContextFile = ({
    filePath,
    content,
    truncated = false,
  }) => {
    if (
      contextFiles.length >= MAX_FILES
    ) {
      return false;
    }

    if (
      typeof content !== "string" ||
      !content.length
    ) {
      return false;
    }

    const remaining =
      MAX_TOTAL_BYTES - totalBytes;

    if (remaining <= 0) {
      return false;
    }

    const contentBytes =
      Buffer.byteLength(
        content,
        "utf8"
      );

    const finalContent =
      contentBytes > remaining
        ? Buffer.from(
            content,
            "utf8"
          )
            .subarray(0, remaining)
            .toString("utf8")
        : content;

    if (!finalContent.length) {
      return false;
    }

    totalBytes += Buffer.byteLength(
      finalContent,
      "utf8"
    );

    contextFiles.push({
      path: filePath,
      content: finalContent,
      truncated:
        truncated ||
        finalContent.length !==
          content.length,
    });

    return true;
  };

  /*
   * First add files whose actual content
   * came from the frontend.
   */
  for (const [
    filePath,
    file,
  ] of suppliedFiles) {
    addContextFile({
      filePath,
      content: file.content,
      truncated: file.truncated,
    });
  }

  /*
   * ---------------------------------------------------------
   * LOAD REQUESTED FILES FROM DISK
   * ---------------------------------------------------------
   */
  const filesToLoad =
    requestedPaths.filter(
      (filePath) =>
        !suppliedFiles.has(filePath)
    );

  for (const relative of filesToLoad) {
    if (
      contextFiles.length >= MAX_FILES ||
      totalBytes >= MAX_TOTAL_BYTES
    ) {
      break;
    }

    const absolute = path.resolve(
      workspacePath,
      relative
    );

    if (
      !absolute.startsWith(
        `${workspacePath}${path.sep}`
      )
    ) {
      continue;
    }

    try {
      const stat =
        await fs.stat(absolute);

      if (
        !stat.isFile() ||
        stat.size > MAX_FILE_BYTES ||
        !isTextFile(relative)
      ) {
        continue;
      }

      const buffer =
        await fs.readFile(absolute);

      const remaining =
        MAX_TOTAL_BYTES - totalBytes;

      const limit = Math.min(
        buffer.length,
        MAX_FILE_BYTES,
        remaining
      );

      const content =
        buffer
          .subarray(0, limit)
          .toString("utf8");

      addContextFile({
        filePath: relative,
        content,
        truncated:
          buffer.length > limit,
      });
    } catch (error) {
      console.warn(
        `[WorkspaceContext] Could not load ${relative}:`,
        error.message
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * FALLBACK: SCAN ENTIRE WORKSPACE
   * ---------------------------------------------------------
   *
   * This is important for the Debugger.
   *
   * If frontend sends only descriptors or nothing,
   * scan the imported GitHub workspace directly.
   */
  if (
    contextFiles.length === 0
  ) {
    const discovered =
      await collectFiles(
        workspacePath
      );

    for (const item of discovered) {
      if (
        contextFiles.length >= MAX_FILES ||
        totalBytes >= MAX_TOTAL_BYTES
      ) {
        break;
      }

      const alreadyLoaded =
        contextFiles.some(
          (file) =>
            file.path ===
            item.relative.replace(
              /\\/g,
              "/"
            )
        );

      if (alreadyLoaded) {
        continue;
      }

      try {
        const buffer =
          await fs.readFile(
            item.absolute
          );

        const remaining =
          MAX_TOTAL_BYTES -
          totalBytes;

        const limit = Math.min(
          buffer.length,
          MAX_FILE_BYTES,
          remaining
        );

        const content =
          buffer
            .subarray(0, limit)
            .toString("utf8");

        addContextFile({
          filePath:
            item.relative.replace(
              /\\/g,
              "/"
            ),
          content,
          truncated:
            buffer.length > limit,
        });
      } catch (error) {
        console.warn(
          `[WorkspaceContext] Failed reading ${item.relative}:`,
          error.message
        );
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * CURRENT FILE FIRST
   * ---------------------------------------------------------
   */
  const current =
    safeRelative(currentFile);

  contextFiles.sort(
    (a, b) => {
      if (
        current &&
        a.path === current
      ) {
        return -1;
      }

      if (
        current &&
        b.path === current
      ) {
        return 1;
      }

      return a.path.localeCompare(
        b.path
      );
    }
  );

  console.log(
    `[WorkspaceContext] ${cleanId}: ${contextFiles.length} files loaded, ${totalBytes} bytes`
  );

  /*
   * IMPORTANT:
   * Never silently tell Gemini that the workspace
   * exists when we actually loaded zero files.
   */
  if (contextFiles.length === 0) {
    throw Object.assign(
      new Error(
        `Workspace "${cleanId}" exists, but no readable source files were found.`
      ),
      {
        status: 422,
        code: "WORKSPACE_FILES_EMPTY",
      }
    );
  }

  return {
    workspaceId: cleanId,
    workspacePath,
    currentFile:
      current || null,

    files: contextFiles,

    fileCount:
      contextFiles.length,

    totalBytes,

    limits: {
      maxFiles: MAX_FILES,
      maxFileBytes:
        MAX_FILE_BYTES,
      maxTotalBytes:
        MAX_TOTAL_BYTES,
    },
  };
};

module.exports = {
  buildWorkspaceContext,
};