import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  FileImage,
  MoreHorizontal,
  RefreshCw,
  GitCommitHorizontal,
  Search,
  Copy,
  ExternalLink,
  Bug,
  Code2,
  Sparkles,
  Download,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Loader2,
  HardDrive,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const STORAGE_KEY = "devspa:explorer:v1";
const REPOSITORIES_KEY = "devspa:explorer:repositories:v1";

const normalizePath = (value = "") =>
  String(value).replace(/^\.?\//, "").replace(/^\/+/, "");

const fileName = (path = "") => {
  const parts = normalizePath(path).split("/");
  return parts[parts.length - 1] || path;
};

const extension = (path = "") => {
  const name = fileName(path);
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(index + 1).toLowerCase() : "";
};

const isTextFile = (path = "") =>
  !["png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "avif", "mp4", "mp3", "woff", "woff2", "ttf"].includes(extension(path));

const iconForFile = (path, folder = false, open = false) => {
  if (folder) return open ? FolderOpen : Folder;
  const ext = extension(path);
  if (["js", "jsx", "ts", "tsx", "mjs", "c", "cpp", "h", "hpp", "java", "py"].includes(ext))
    return FileCode2;
  if (["json", "jsonc"].includes(ext)) return FileJson;
  if (["png", "jpg", "jpeg", "gif", "webp", "ico", "svg"].includes(ext))
    return FileImage;
  return FileText;
};

function buildTree(files) {
  const root = [];

  for (const raw of files || []) {
    const path = normalizePath(raw.path || raw.name || "");
    if (!path) continue;

    const parts = path.split("/");
    let level = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folder = index < parts.length - 1;
      let node = level.find((item) => item.path === currentPath);

      if (!node) {
        node = {
          path: currentPath,
          name: part,
          folder,
          children: [],
          file: folder ? null : raw,
        };
        level.push(node);
      } else if (!folder) {
        node.file = raw;
      }

      level = node.children;
    });
  }

  const sortTree = (nodes) => {
    nodes.sort((a, b) => {
      if (a.folder !== b.folder) return a.folder ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
    nodes.forEach((node) => node.folder && sortTree(node.children));
    return nodes;
  };

  return sortTree(root);
}

function normalizeWorkspaceFiles(result) {
  const candidates = [
    result?.files,
    result?.workspaceFiles,
    result?.workspace?.files,
    result?.data?.files,
  ];

  const source = candidates.find(Array.isArray) || [];
  return source
    .map((item) => {
      if (typeof item === "string") return { path: normalizePath(item) };
      const path = normalizePath(item?.path || item?.name || "");
      return path ? { ...item, path } : null;
    })
    .filter(Boolean);
}

function hasChanges(file) {
  if (!file) return false;
  if (file.status === "modified" || file.status === "deleted" || file.modified || file.isModified || file.deleted) return true;
  if (
    typeof file.originalContent === "string" &&
    typeof file.content === "string"
  ) {
    return file.originalContent !== file.content;
  }
  return false;
}

function ContextMenu({ menu, onAction }) {
  if (!menu) return null;

  const items = [
    { id: "editor", label: "Open in Editor", icon: Code2 },
    { id: "debugger", label: "Open in Debugger", icon: Bug },
    { id: "ai", label: "Analyze with AI", icon: Sparkles },
    { divider: true },
    { id: "copyPath", label: "Copy Path", icon: Copy },
    { id: "copyUrl", label: "Copy GitHub URL", icon: ExternalLink },
    { id: "download", label: "Download", icon: Download },
    { divider: true },
    { id: "delete", label: "Delete", icon: Trash2, danger: true },
  ];

  return (
    <div
      className="fixed z-[5000] w-60 overflow-hidden rounded-xl border border-white/10 bg-[#111318]/95 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-2xl"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-2">
        <div className="truncate text-[11px] font-medium text-white/75">
          {fileName(menu.node.path)}
        </div>
        <div className="mt-0.5 truncate font-mono text-[9px] text-white/25">
          {menu.node.path}
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="my-1 h-px bg-white/[0.06]" />;
        }

        const Icon = item.icon;
        const disabled =
          (item.id === "download" && menu.node.folder) ||
          (item.id === "copyUrl" && !menu.repo) ||
          (item.id === "delete" && menu.node.folder);

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onAction(item.id)}
            className={[
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] transition disabled:pointer-events-none disabled:opacity-25",
              item.danger ? "text-red-300/85 hover:bg-red-500/10 hover:text-red-200" : "text-white/60 hover:bg-white/[0.07] hover:text-white",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedPath,
  expanded,
  setExpanded,
  onSelect,
  onOpen,
  onContextMenu,
}) {
  const isOpen = expanded.has(node.path);
  const Icon = iconForFile(node.path, node.folder, isOpen);
  const selected = !node.folder && selectedPath === node.path;

  const handleClick = () => {
    if (node.folder) {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(node.path)) next.delete(node.path);
        else next.add(node.path);
        return next;
      });
      return;
    }
    // Single click only selects. Opening is intentionally reserved for double click.
    onSelect?.(node.file);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={() => !node.folder && onOpen?.(node.file)}
        onContextMenu={(event) => onContextMenu(event, node)}
        className={[
          "group flex w-full items-center gap-1.5 rounded-lg py-[5px] text-left text-[11px] transition",
          selected
            ? "bg-white/[0.085] text-white"
            : "text-white/45 hover:bg-white/[0.045] hover:text-white/75",
        ].join(" ")}
        style={{ paddingLeft: 8 + depth * 15, paddingRight: 8 }}
        title={node.path}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-white/30">
          {node.folder ? (
            isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : null}
        </span>

        <Icon
          className={[
            "h-3.5 w-3.5 shrink-0",
            node.folder ? "text-white/45" : "text-white/30",
          ].join(" ")}
        />

        <span className="min-w-0 flex-1 truncate">{node.name}</span>

        {!node.folder && hasChanges(node.file) && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300"
            title="Uncommitted change"
          />
        )}
      </button>

      {node.folder && isOpen && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expanded={expanded}
              setExpanded={setExpanded}
              onSelect={onSelect}
              onOpen={onOpen}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Explorer({
  repository = null,
  workspaceId = "",
  workspaceFiles = [],
  branch = "main",
  onOpenEditor,
  onOpenDebugger,
  onAnalyzeFile,
  onRefresh,
  onImport,
  onCommit,
  onSelectRepository,
}) {
  const [search, setSearch] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [menu, setMenu] = useState(null);
  const [showCommit, setShowCommit] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedRepositories, setSavedRepositories] = useState([]);
  const [activeRepository, setActiveRepository] = useState(repository);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaceId);
  const [activeFiles, setActiveFiles] = useState(workspaceFiles);
  const [driveLoading, setDriveLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const rootRef = useRef(null);

  const activeRepoUrl = useMemo(() => {
    if (!activeRepository) return "";
    if (activeRepository.html_url) return activeRepository.html_url.replace(/\.git$/, "");
    if (activeRepository.htmlUrl) return activeRepository.htmlUrl.replace(/\.git$/, "");
    if (activeRepository.fullName) return `https://github.com/${activeRepository.fullName}`;
    if (activeRepository.url?.includes("github.com")) return activeRepository.url.replace(/\.git$/, "");
    return "";
  }, [activeRepository]);

  // Keep the local Explorer drive authoritative while the parent window state
  // changes. Opening a file can temporarily cause the parent to render with an
  // empty workspaceFiles array; never let that transient render erase the
  // imported repository from Explorer. Only replace the local file tree when
  // the parent actually provides files.
  useEffect(() => {
    if (repository) setActiveRepository(repository);
    if (workspaceId) setActiveWorkspaceId(String(workspaceId));
    if (Array.isArray(workspaceFiles) && workspaceFiles.length > 0) {
      setActiveFiles(workspaceFiles);
    }
  }, [repository, workspaceId, workspaceFiles]);

  // Recovery guard: if the parent temporarily drops the file list, reload the
  // tree from the existing workspace instead of forcing the user to import the
  // repository again.
  useEffect(() => {
    if (!activeWorkspaceId || activeFiles.length > 0) return;

    let cancelled = false;
    const recover = async () => {
      const endpoints = [
        `${API_BASE}/api/github/workspace/${encodeURIComponent(activeWorkspaceId)}/files`,
        `${API_BASE}/api/github/workspace/${encodeURIComponent(activeWorkspaceId)}/tree`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (!response.ok) continue;
          const result = await response.json().catch(() => ({}));
          const files = normalizeWorkspaceFiles(result);
          if (!cancelled && files.length) {
            setActiveFiles(files);
            return;
          }
        } catch {
          // Try the next workspace-tree endpoint.
        }
      }
    };

    recover();
    return () => { cancelled = true; };
  }, [activeWorkspaceId, activeFiles.length]);

  // Load the Windows-like repository drives persisted in this browser.
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(REPOSITORIES_KEY) || "[]");
      setSavedRepositories(Array.isArray(raw) ? raw : []);
    } catch {
      setSavedRepositories([]);
    }
  }, []);

  // Every successful import becomes a persistent repository drive.
  useEffect(() => {
    if (!repository || !workspaceId) return;

    const repoUrl = repository.html_url || repository.htmlUrl ||
      (repository.fullName ? `https://github.com/${repository.fullName}` : "");
    if (!repoUrl) return;

    const drive = {
      id: String(workspaceId),
      workspaceId: String(workspaceId),
      name: repository.name || repository.fullName?.split("/").pop() || "Repository",
      fullName: repository.fullName || repository.name || "Repository",
      repoUrl: repoUrl.replace(/\.git$/, ""),
      branch: repository.defaultBranch || repository.branch || branch || "main",
      avatarUrl: repository.owner?.avatar_url || repository.owner?.avatarUrl || "",
      updatedAt: Date.now(),
    };

    setSavedRepositories((current) => {
      const next = [drive, ...current.filter((item) => item.id !== drive.id)];
      try { localStorage.setItem(REPOSITORIES_KEY, JSON.stringify(next.slice(0, 50))); } catch {}
      return next.slice(0, 50);
    });
  }, [repository, workspaceId, branch]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.workspaceId === workspaceId) {
        setSearch(saved.search || "");
        setSelectedPath(saved.selectedPath || "");
        setExpanded(new Set(saved.expanded || []));
      }
    } catch {
      // Ignore corrupted local UI state.
    }
  }, [workspaceId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          workspaceId,
          search,
          selectedPath,
          expanded: [...expanded],
        })
      );
    } catch {
      // Storage can be unavailable; Explorer still works.
    }
  }, [workspaceId, search, selectedPath, expanded]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeFiles.filter((file) => !file.deleted);
    return activeFiles.filter((file) => !file.deleted &&
      normalizePath(file.path).toLowerCase().includes(q)
    );
  }, [activeFiles, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  const changedFiles = useMemo(
    () =>
      activeFiles
        .filter(hasChanges)
        .map((file) => ({
          path: normalizePath(file.path),
          content: file.deleted ? null : file.content,
          deleted: Boolean(file.deleted),
        })),
    [activeFiles]
  );

  const repoUrl = activeRepoUrl;
  const currentRepository = activeRepository;
  const currentWorkspaceId = activeWorkspaceId;

  const selectFile = (file) => {
    if (!file || file.deleted) return;
    setSelectedPath(normalizePath(file.path));
  };

  const openFile = (file, mode = "editor") => {
    if (!file) return;
    const path = normalizePath(file.path);
    setSelectedPath(path);

    const payload = {
      // Canonical workspace fields used by DevSpa/WindowManager/Debugger.
      workspaceId: String(currentWorkspaceId || ''),
      repository: currentRepository || null,
      files: activeFiles,

      // Keep the legacy fields for compatibility with older integrations.
      currentWorkspaceId,
      currentRepository,
      file: { ...file, path },
      path,
      mode,
    };

    if (mode === "debugger") {
      // Use one integration path only. Calling both the callback and the
      // window event can open the Debugger twice and reset the workspace state.
      if (onOpenDebugger) onOpenDebugger(payload);
      else window.dispatchEvent(new CustomEvent("devspa:open-debugger", { detail: payload }));
      return;
    }

    // Use one integration path only. The previous implementation invoked both
    // paths, which could cause a second editor/window state update and make the
    // Explorer appear empty until the repository was imported again.
    if (onOpenEditor) onOpenEditor(payload);
    else window.dispatchEvent(new CustomEvent("devspa:open-editor", { detail: payload }));
  };

  const analyzeFile = (node) => {
    const file = node?.file;
    if (!file) return;
    const payload = {
      workspaceId: String(currentWorkspaceId || ''),
      repository: currentRepository || null,
      files: activeFiles,
      currentWorkspaceId,
      currentRepository,
      path: normalizePath(file.path),
      file,
    };
    onAnalyzeFile?.(payload);
    window.dispatchEvent(new CustomEvent("devspa:analyze-file", { detail: payload }));
  };

  const handleContextAction = async (action) => {
    if (!menu) return;
    const node = menu.node;
    setMenu(null);

    if (action === "editor") return openFile(node.file, "editor");
    if (action === "debugger") return openFile(node.file, "debugger");
    if (action === "ai") return analyzeFile(node);

    if (action === "copyPath") {
      await navigator.clipboard?.writeText(normalizePath(node.path));
      setNotice("Path copied");
      setTimeout(() => setNotice(""), 1400);
      return;
    }

    if (action === "copyUrl") {
      if (!repoUrl || node.folder) return;
      await navigator.clipboard?.writeText(
        `${repoUrl}/blob/${encodeURIComponent(branch)}/${normalizePath(node.path)}`
      );
      setNotice("GitHub URL copied");
      setTimeout(() => setNotice(""), 1400);
      return;
    }

    if (action === "delete") {
      if (node.folder || !currentWorkspaceId) return;
      const path = normalizePath(node.path);
      const confirmed = window.confirm(`Delete "${path}" from this workspace?`);
      if (!confirmed) return;

      try {
        const response = await fetch(
          `${API_BASE}/api/github/workspace/${encodeURIComponent(currentWorkspaceId)}/file?path=${encodeURIComponent(path)}`,
          { method: "DELETE", credentials: "include" }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Delete failed.");
        }

        // Keep a deletion tombstone in local state so Commit & Push can
        // still send the deletion to GitHub, while the Explorer hides it.
        setActiveFiles((current) => {
          const nextFiles = current.map((file) =>
            normalizePath(file.path) === path
              ? { ...file, deleted: true, status: "deleted" }
              : file
          );

          // Keep the parent WindowManager in sync so its workspaceFiles
          // prop cannot immediately restore the deleted file.
          onSelectRepository?.({
            repository: currentRepository,
            workspaceId: currentWorkspaceId,
            files: nextFiles,
          });

          return nextFiles;
        });
        setSelectedPath((current) => current === path ? "" : current);
        setNotice(`Deleted ${path}. Commit to push the deletion to GitHub.`);
        setTimeout(() => setNotice(""), 2600);
        return;
      } catch (error) {
        setNotice(error?.message || "Delete failed.");
        setTimeout(() => setNotice(""), 2600);
        return;
      }
    }

    if (action === "download") {
      if (node.folder || !currentWorkspaceId) return;
      const url =
        `${API_BASE}/api/github/workspace/${encodeURIComponent(currentWorkspaceId)}/file` +
        `?path=${encodeURIComponent(normalizePath(node.path))}`;

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
    }
  };

  const handleCommit = async () => {
    if (!currentRepository || !repoUrl || changedFiles.length === 0) return;

    const message = commitMessage.trim();
    if (!message) {
      setCommitError("Enter a commit message.");
      return;
    }

    setCommitLoading(true);
    setCommitError("");

    try {
      const payload = {
        repoUrl,
        branch,
        message,
        files: changedFiles,
        currentWorkspaceId,
      };

      if (onCommit) {
        await onCommit(payload);
      } else {
        const response = await fetch(`${API_BASE}/api/github/commit`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Commit & Push failed.");
        }
      }

      setShowCommit(false);
      setCommitMessage("");
      setActiveFiles((current) => current
        .filter((file) => !file.deleted)
        .map((file) => hasChanges(file) ? { ...file, modified: false, isModified: false, status: null } : file)
      );
      setNotice("Changes committed to GitHub");
      setTimeout(() => setNotice(""), 1800);
    } catch (error) {
      setCommitError(error?.message || "Commit failed.");
    } finally {
      setCommitLoading(false);
    }
  };

  const refresh = async () => {
    if (changedFiles.length > 0) {
      const ok = window.confirm(
        `You have ${changedFiles.length} uncommitted file(s). Refresh may replace the current workspace state. Continue?`
      );
      if (!ok) return;
    }

    if (onRefresh) {
      await onRefresh();
      return;
    }

    if (!repoUrl) return;

    // Safe fallback: re-import through the existing backend import endpoint.
    // Prefer passing an onRefresh handler from the parent so the parent's
    // currentRepository/workspace state stays authoritative.
    try {
      const response = await fetch(`${API_BASE}/api/github/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Refresh failed.");
      }
      window.location.reload();
    } catch (error) {
      setNotice(error?.message || "Refresh failed");
      setTimeout(() => setNotice(""), 2200);
    }
  };

  const forgetDrive = (driveId) => {
    setSavedRepositories((current) => {
      const next = current.filter((item) => item.id !== driveId);
      try { localStorage.setItem(REPOSITORIES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setNotice("Repository removed from Explorer");
    setTimeout(() => setNotice(""), 1600);
  };

  const switchDrive = async (drive) => {
    if (!drive?.repoUrl) return;
    if (String(drive.workspaceId) === String(currentWorkspaceId)) return;

    setDriveLoading(true);
    setNotice(`Opening ${drive.fullName || drive.name}â€¦`);

    try {
      // Reuse the existing import API so the backend remains the single source
      // of truth for GitHub authentication and workspace creation.
      const response = await fetch(`${API_BASE}/api/github/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: drive.repoUrl }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to open repository.");
      }

      const nextRepository = result.repository || {
        name: drive.name,
        fullName: drive.fullName,
        html_url: drive.repoUrl,
        defaultBranch: drive.branch || "main",
      };
      const nextWorkspaceId = String(
        result.workspaceId || result.workspace?.id || result.workspace?.workspaceId || drive.workspaceId || ""
      );
      const nextFiles = normalizeWorkspaceFiles(result);

      setActiveRepository(nextRepository);
      setActiveWorkspaceId(nextWorkspaceId);
      setActiveFiles(nextFiles);
      setSelectedPath(nextFiles[0]?.path || "");
      setExpanded(new Set());

      const updatedDrive = {
        ...drive,
        id: nextWorkspaceId || drive.id,
        workspaceId: nextWorkspaceId || drive.workspaceId,
        fullName: nextRepository.fullName || drive.fullName,
        name: nextRepository.name || drive.name,
        repoUrl: (nextRepository.html_url || drive.repoUrl).replace(/\.git$/, ""),
        branch: nextRepository.defaultBranch || nextRepository.branch || drive.branch || "main",
        updatedAt: Date.now(),
      };

      setSavedRepositories((current) => {
        const next = [updatedDrive, ...current.filter((item) => item.repoUrl !== updatedDrive.repoUrl)];
        try { localStorage.setItem(REPOSITORIES_KEY, JSON.stringify(next.slice(0, 50))); } catch {}
        return next.slice(0, 50);
      });

      onSelectRepository?.({
        repository: nextRepository,
        workspaceId: nextWorkspaceId,
        files: nextFiles,
      });
      window.dispatchEvent(new CustomEvent("devspa:select-repository", {
        detail: { repository: nextRepository, workspaceId: nextWorkspaceId, files: nextFiles },
      }));

      setNotice(`Opened ${nextRepository.fullName || drive.name}`);
      setTimeout(() => setNotice(""), 1800);
    } catch (error) {
      setNotice(error?.message || "Unable to open repository");
      setTimeout(() => setNotice(""), 2600);
    } finally {
      setDriveLoading(false);
    }
  };

  const openImportDialog = () => {
    setImportError("");
    setImportUrl("");
    setShowImport(true);
  };

  const submitImport = async () => {
    const url = importUrl.trim();
    if (!url) {
      setImportError("Paste a GitHub repository URL.");
      return;
    }

    setImportLoading(true);
    setImportError("");

    try {
      const response = await fetch(`${API_BASE}/api/github/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Repository import failed.");
      }

      const nextRepository = result.repository || {
        fullName: url.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, ""),
        html_url: url.replace(/\.git$/, ""),
      };
      const nextWorkspaceId = String(result.workspaceId || result.workspace?.id || result.workspace?.workspaceId || "");
      const nextFiles = normalizeWorkspaceFiles(result);

      setActiveRepository(nextRepository);
      setActiveWorkspaceId(nextWorkspaceId);
      setActiveFiles(nextFiles);
      setSelectedPath(nextFiles[0]?.path || "");
      setExpanded(new Set());
      setShowImport(false);

      const drive = {
        id: nextWorkspaceId || nextRepository.fullName || url,
        workspaceId: nextWorkspaceId,
        name: nextRepository.name || nextRepository.fullName?.split("/").pop() || "Repository",
        fullName: nextRepository.fullName || nextRepository.name || "Repository",
        repoUrl: (nextRepository.html_url || nextRepository.htmlUrl || url).replace(/\.git$/, ""),
        branch: nextRepository.defaultBranch || nextRepository.branch || "main",
        avatarUrl: nextRepository.owner?.avatar_url || "",
        updatedAt: Date.now(),
      };
      setSavedRepositories((current) => {
        const next = [drive, ...current.filter((item) => item.repoUrl !== drive.repoUrl)];
        try { localStorage.setItem(REPOSITORIES_KEY, JSON.stringify(next.slice(0, 50))); } catch {}
        return next.slice(0, 50);
      });

      onSelectRepository?.({ repository: nextRepository, workspaceId: nextWorkspaceId, files: nextFiles });
      window.dispatchEvent(new CustomEvent("devspa:repository-imported", {
        detail: { repository: nextRepository, workspaceId: nextWorkspaceId, files: nextFiles, result },
      }));
      setNotice(`Imported ${nextRepository.fullName || "repository"}`);
      setTimeout(() => setNotice(""), 1800);
    } catch (error) {
      setImportError(error?.message || "Repository import failed.");
    } finally {
      setImportLoading(false);
    }
  };

  const status =
    changedFiles.length > 0
      ? `${changedFiles.length} changed`
      : currentRepository
        ? "Synced"
        : "Local";

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#080a0e] text-white select-none"
    >
      {/* Explorer header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#0b0d11] px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]">
          <Folder className="h-4 w-4 text-white/60" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white/85">
              Explorer
            </span>
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
                currentRepository
                  ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300/80"
                  : "border-white/10 bg-white/[0.03] text-white/30",
              ].join(" ")}
            >
              {status}
            </span>
          </div>
          <div className="mt-0.5 max-w-[420px] truncate text-[9px] text-white/25">
            {currentRepository?.fullName || "No repository loaded"}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={refresh}
            title="Refresh workspace"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/80"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={openImportDialog}
            title="Import GitHub repository"
            className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-[10px] font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Import
          </button>

          <button
            type="button"
            disabled={!changedFiles.length}
            onClick={() => {
              setCommitError("");
              setShowCommit(true);
            }}
            title={
              changedFiles.length
                ? `Commit ${changedFiles.length} changed file(s)`
                : "No uncommitted changes"
            }
            className="flex h-8 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 text-[10px] font-semibold text-emerald-300/80 transition hover:bg-emerald-400/[0.1] disabled:pointer-events-none disabled:opacity-25"
          >
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            Commit
          </button>
        </div>
      </div>

      {/* Breadcrumb / stats */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.05] px-4 text-[9px]">
        <div className="flex min-w-0 items-center gap-2 text-white/25">
          <span>WORKSPACE</span>
          <span>/</span>
          <span className="truncate text-white/50">
            {currentRepository?.fullName || "Workspace"}
          </span>
          {currentWorkspaceId && (
            <>
              <span>/</span>
              <span className="font-mono text-white/20">{currentWorkspaceId}</span>
            </>
          )}
        </div>
        <div className="shrink-0 text-white/20">
          {activeFiles.length} files
        </div>
      </div>

      {/* Workspace / repository drives */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#090b0f]">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.05] px-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-3.5 w-3.5 text-white/35" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Repositories
              </span>
            </div>
            <button
              type="button"
              onClick={openImportDialog}
              title="Add repository drive"
              className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {savedRepositories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.07] p-3 text-center">
                <HardDrive className="mx-auto h-5 w-5 text-white/15" />
                <p className="mt-2 text-[10px] text-white/30">No repository drives</p>
                <p className="mt-1 text-[9px] leading-4 text-white/15">Import a repository and it will stay here like a drive.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {savedRepositories.map((drive) => {
                  const active = String(drive.workspaceId) === String(currentWorkspaceId) ||
                    drive.repoUrl === repoUrl;
                  return (
                    <div
                      key={drive.id}
                      className={`group rounded-xl border transition ${active ? "border-white/[0.11] bg-white/[0.055]" : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.03]"}`}
                    >
                      <button
                        type="button"
                        onClick={() => switchDrive(drive)}
                        disabled={driveLoading}
                        className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left disabled:opacity-50"
                        title={`Open ${drive.fullName || drive.name}`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${active ? "border-cyan-300/15 bg-cyan-300/[0.06]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                          <HardDrive className={`h-4 w-4 ${active ? "text-cyan-200/70" : "text-white/30"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-[10px] font-medium ${active ? "text-white/80" : "text-white/55"}`}>
                            {drive.name}
                          </div>
                          <div className="mt-0.5 truncate text-[8px] text-white/20">
                            {drive.fullName}
                          </div>
                        </div>
                        {active && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300/65" />}
                      </button>
                      <div className="flex items-center justify-between px-2.5 pb-1.5">
                        <span className="font-mono text-[8px] text-white/15">
                          {drive.branch || "main"}
                        </span>
                        <button
                          type="button"
                          onClick={() => forgetDrive(drive.id)}
                          title="Remove from Explorer (does not delete GitHub repository)"
                          className="rounded p-1 text-white/15 opacity-0 transition hover:bg-red-400/[0.08] hover:text-red-300/70 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/[0.05] p-2.5">
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.018] px-2.5 py-2">
              <div className="text-[8px] uppercase tracking-[0.14em] text-white/20">This PC</div>
              <div className="mt-1 text-[9px] text-white/35">DEVSPA Workspace</div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          {/* Search */}
          <div className="shrink-0 border-b border-white/[0.05] p-3">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 focus-within:border-white/[0.16]">
          <Search className="h-3.5 w-3.5 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files and folders..."
            className="min-w-0 flex-1 bg-transparent text-[11px] text-white/75 outline-none placeholder:text-white/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-white/25 transition hover:text-white/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden rounded border border-white/[0.07] px-1.5 py-0.5 font-mono text-[8px] text-white/20 sm:block">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2 [scrollbar-color:rgba(255,255,255,.12)_transparent] [scrollbar-width:thin]">
        {!currentRepository ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">
                <FolderOpen className="h-6 w-6 text-white/25" />
              </div>
              <div className="mt-4 text-sm font-semibold text-white/60">
                No repository loaded
              </div>
              <div className="mt-2 text-[10px] leading-5 text-white/25">
                Import a GitHub repository to browse files, open them in the
                editor or debugger, analyze them with AI, and commit changes.
              </div>
              <button
                type="button"
                onClick={openImportDialog}
                className="mt-5 rounded-lg bg-white px-4 py-2 text-[10px] font-semibold text-black transition hover:bg-white/90"
              >
                Import Repository
              </button>
            </div>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] text-white/25">
            No files match â€œ{search}â€
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expanded={expanded}
              setExpanded={setExpanded}
              onSelect={selectFile}
              onOpen={(file) => openFile(file, "editor")}
              onContextMenu={(event, currentNode) => {
                event.preventDefault();
                event.stopPropagation();

                const width = 240;
                const height = 350;
                const x = Math.min(event.clientX, window.innerWidth - width - 8);
                const y = Math.min(event.clientY, window.innerHeight - height - 8);

                setMenu({
                  x: Math.max(8, x),
                  y: Math.max(8, y),
                  node: currentNode,
                  repo: currentRepository,
                });
              }}
            />
          ))
        )}
      </div>

        </main>
      </div>

      {/* Status bar */}
      <div className="flex h-8 shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#090b0f] px-3 text-[9px]">
        <div className="flex min-w-0 items-center gap-2 text-white/25">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
          <span>{currentRepository ? "Workspace ready" : "No workspace"}</span>
          {changedFiles.length > 0 && (
            <>
              <span className="text-white/10">â€¢</span>
              <span className="text-amber-300/60">
                {changedFiles.length} pending
              </span>
            </>
          )}
        </div>

        <div className="font-mono text-white/20">
          {branch}
        </div>
      </div>

      <ContextMenu menu={menu} onAction={handleContextAction} />

      {notice && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[6000] -translate-x-1/2 rounded-lg border border-white/10 bg-[#15181e]/95 px-3 py-2 text-[10px] text-white/70 shadow-2xl backdrop-blur-xl">
          {notice}
        </div>
      )}

      {/* Import repository modal */}
      {showImport && (
        <div
          className="fixed inset-0 z-[5600] flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget && !importLoading) setShowImport(false);
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#101318] shadow-[0_30px_100px_rgba(0,0,0,.7)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white/85">Import repository drive</div>
                <div className="mt-1 text-[10px] text-white/25">Add a GitHub repository to your DEVSPA workspace.</div>
              </div>
              <button
                type="button"
                disabled={importLoading}
                onClick={() => setShowImport(false)}
                className="rounded-lg p-2 text-white/25 hover:bg-white/[0.05] hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <label className="text-[9px] uppercase tracking-widest text-white/25">GitHub repository URL</label>
              <input
                autoFocus
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitImport();
                }}
                placeholder="https://github.com/owner/repository"
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-[11px] text-white/75 outline-none placeholder:text-white/20 focus:border-white/20"
              />

              {importError && (
                <div className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-[10px] text-red-200/70">
                  {importError}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={importLoading}
                  onClick={() => setShowImport(false)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/45 hover:bg-white/[0.05] hover:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importLoading || !importUrl.trim()}
                  onClick={submitImport}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[10px] font-semibold text-black transition hover:bg-white/90 disabled:pointer-events-none disabled:opacity-30"
                >
                  {importLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {importLoading ? "Importingâ€¦" : "Import repository"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commit modal */}
      {showCommit && (
        <div
          className="fixed inset-0 z-[5500] flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget && !commitLoading) {
              setShowCommit(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#101318] shadow-[0_30px_100px_rgba(0,0,0,.7)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white/85">
                  Commit changes
                </div>
                <div className="mt-1 text-[10px] text-white/25">
                  {changedFiles.length} file{changedFiles.length === 1 ? "" : "s"} will be pushed to GitHub
                </div>
              </div>
              <button
                type="button"
                disabled={commitLoading}
                onClick={() => setShowCommit(false)}
                className="rounded-lg p-2 text-white/25 hover:bg-white/[0.05] hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-4">
              {changedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 border-b border-white/[0.04] py-2 last:border-0"
                >
                  <Check className="h-3 w-3 text-emerald-300/70" />
                  <span className="truncate font-mono text-[10px] text-white/55">
                    {file.path}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.07] p-4">
              <label className="text-[9px] uppercase tracking-widest text-white/25">
                Commit message
              </label>
              <input
                autoFocus
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleCommit();
                }}
                placeholder="Fix UI issue"
                className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-[11px] text-white/75 outline-none placeholder:text-white/20 focus:border-white/20"
              />

              {commitError && (
                <div className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-[10px] text-red-200/70">
                  {commitError}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={commitLoading}
                  onClick={() => setShowCommit(false)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/45 hover:bg-white/[0.05] hover:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={commitLoading || !commitMessage.trim()}
                  onClick={handleCommit}
                  className="flex items-center gap-2 rounded-lg bg-emerald-300 px-4 py-2 text-[10px] font-semibold text-black transition hover:bg-emerald-200 disabled:pointer-events-none disabled:opacity-30"
                >
                  {commitLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {commitLoading ? "Committingâ€¦" : "Commit & Push"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

