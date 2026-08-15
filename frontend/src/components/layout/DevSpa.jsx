import React, { useCallback, useEffect, useState } from "react";
import Wallpaper from "../os/Wallpaper";
import Desktop from "../os/Desktop";
import WindowManager from "../os/WindowManager";
import Taskbar from "../os/Taskbar";
import DragonCursor from "../assistant/DragonCursor";
import "../assistant/dragon-universal.css";

const normalizeFile = (file = {}) => ({
  ...file,
  id: file.id || file.path || file.name,
  path: String(file.path || file.name || "").replace(/^\/+/, ""),
  name: file.name || String(file.path || "").split("/").pop() || "untitled",
});

const normalizeWorkspace = (payload) => {
  const workspace = payload?.workspace || payload || {};
  // Explorer sends currentRepository/currentWorkspaceId while other parts of
  // DEVSPA use repository/workspaceId. Accept both shapes so opening a file
  // never drops the active repository from the Editor.
  const repository =
    workspace.repository ||
    payload?.repository ||
    payload?.currentRepository ||
    null;

  const workspaceId = String(
    workspace.workspaceId ||
      workspace.id ||
      payload?.workspaceId ||
      payload?.currentWorkspaceId ||
      repository?.workspaceId ||
      ""
  );
  const rawFiles = workspace.files || payload?.files || workspace.tree || payload?.tree || [];
  const files = Array.isArray(rawFiles)
    ? rawFiles.map(normalizeFile).filter((file) => file.path)
    : [];
  return { workspaceId, repository, files };
};

const DEVSPA_SESSION_KEY = "devspa-session-v1";

const getInitialSession = () => {
  const emptySession = {
    windows: [],
    activeWindow: null,
    workspace: { workspaceId: "", repository: null, files: [] },
    editorRequest: null,
    debuggerRequest: null,
  };

  try {
    const raw = localStorage.getItem(DEVSPA_SESSION_KEY);
    if (!raw) return emptySession;

    const saved = JSON.parse(raw);

    const windows = Array.isArray(saved.windows)
      ? saved.windows.filter(
          (window) =>
            window &&
            typeof window.id === "string" &&
            typeof window.x === "number" &&
            typeof window.y === "number" &&
            typeof window.width === "number" &&
            typeof window.height === "number"
        )
      : [];

    const activeWindow =
      typeof saved.activeWindow === "string" &&
      windows.some((window) => window.id === saved.activeWindow)
        ? saved.activeWindow
        : null;

    const workspace = saved.workspace && typeof saved.workspace === "object"
      ? {
          workspaceId: String(saved.workspace.workspaceId || ""),
          repository: saved.workspace.repository || null,
          files: Array.isArray(saved.workspace.files) ? saved.workspace.files : [],
        }
      : emptySession.workspace;

    return {
      windows,
      activeWindow,
      workspace,
      editorRequest: saved.editorRequest || null,
      debuggerRequest: saved.debuggerRequest || null,
    };
  } catch (error) {
    console.warn("DEVSPA: unable to restore previous desktop session.", error);
    return emptySession;
  }
};

const Devspa = () => {
  const [initialSession] = useState(getInitialSession);

  const [windows, setWindows] = useState(initialSession.windows);
  const [activeWindow, setActiveWindow] = useState(initialSession.activeWindow);
  const [workspace, setWorkspace] = useState(initialSession.workspace);
  const [editorRequest, setEditorRequest] = useState(initialSession.editorRequest);
  const [debuggerRequest, setDebuggerRequest] = useState(initialSession.debuggerRequest);

  // Persist the complete desktop session so a browser reload does not close
  // the currently open windows or reset their positions/state.
  useEffect(() => {
    try {
      localStorage.setItem(
        DEVSPA_SESSION_KEY,
        JSON.stringify({
          windows,
          activeWindow,
          workspace,
          editorRequest,
          debuggerRequest,
        })
      );
    } catch (error) {
      console.warn("DEVSPA: unable to save desktop session.", error);
    }
  }, [
    windows,
    activeWindow,
    workspace,
    editorRequest,
    debuggerRequest,
  ]);

  const openWindow = useCallback((appId) => {
    setWindows((prev) => {
      const existing = prev.find((window) => window.id === appId);
      if (existing) {
        return prev.map((window) =>
          window.id === appId ? { ...window, minimized: false } : window
        );
      }
      return [
        ...prev,
        {
          id: appId,
          x: 140 + prev.length * 35,
          y: 80 + prev.length * 30,
          width: 900,
          height: 600,
          minimized: false,
          maximized: false,
        },
      ];
    });
    setActiveWindow(appId);
  }, []);

  const moveWindow = (id, x, y) =>
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));

  const closeWindow = (id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindow((prev) => (prev === id ? null : prev));
  };

  const minimizeWindow = (id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    setActiveWindow((prev) => (prev === id ? null : prev));
  };

  const restoreWindow = (id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: false } : w)));
    setActiveWindow(id);
  };

  const maximizeWindow = (id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
    setActiveWindow(id);
  };

  const focusWindow = (id) => {
    setActiveWindow(id);
    setWindows((prev) => {
      const selected = prev.find((w) => w.id === id);
      if (!selected) return prev;
      return [...prev.filter((w) => w.id !== id), selected];
    });
  };

  const handleWorkspaceChange = useCallback((payload) => {
    const next = normalizeWorkspace(payload);

    setWorkspace((current) => {
      const workspaceChanged =
        Boolean(next.workspaceId) &&
        Boolean(current.workspaceId) &&
        String(next.workspaceId) !== String(current.workspaceId);

      return {
        // A workspace/repository is an isolated session. When the user opens
        // another repository, never keep the previous repository's files.
        workspaceId: next.workspaceId || current.workspaceId,
        repository: next.repository || (workspaceChanged ? null : current.repository),
        files: next.files.length
          ? next.files
          : workspaceChanged
            ? []
            : current.files,
      };
    });
  }, []);

  const handleOpenEditor = useCallback((payload) => {
    const next = normalizeWorkspace(payload);
    handleWorkspaceChange(payload);
    setEditorRequest({
      ...payload,
      workspaceId: next.workspaceId,
      repository: next.repository,
      files: next.files.length ? next.files : workspace.files,
      file: payload?.file || null,
      nonce: Date.now(),
    });
    openWindow("editor");
  }, [handleWorkspaceChange, openWindow]);

  const handleOpenDebugger = useCallback((payload) => {
    const next = normalizeWorkspace(payload);
    const files = next.files.length ? next.files : workspace.files;

    handleWorkspaceChange({
      ...payload,
      workspaceId: next.workspaceId,
      repository: next.repository,
      files,
    });

    setDebuggerRequest({
      ...payload,
      workspaceId: next.workspaceId,
      repository: next.repository,
      files,
      file: payload?.file || null,
      analyze: false,
      nonce: Date.now(),
    });
    openWindow("debugger");
  }, [handleWorkspaceChange, openWindow, workspace]);


  const handleAssistantOpenFile = useCallback((filePath) => {
    const path = typeof filePath === "string" ? filePath : filePath?.path || filePath?.name || "";
    if (!path) return;

    const file = workspace.files.find((item) => item.path === path || item.name === path) || { path };
    handleOpenEditor({
      workspaceId: workspace.workspaceId,
      repository: workspace.repository,
      files: workspace.files,
      file,
      source: "ai-assistant",
    });
  }, [workspace, handleOpenEditor]);

  const handleAnalyzeFile = useCallback((payload) => {
    const next = normalizeWorkspace(payload);
    const files = next.files.length ? next.files : workspace.files;

    handleWorkspaceChange({
      ...payload,
      workspaceId: next.workspaceId,
      repository: next.repository,
      files,
    });

    setDebuggerRequest({
      ...payload,
      workspaceId: next.workspaceId,
      repository: next.repository,
      files,
      file: payload?.file || null,
      analyze: true,
      nonce: Date.now(),
    });
    openWindow("debugger");
  }, [handleWorkspaceChange, openWindow, workspace]);

  const handleAssistantTool = useCallback(async (command) => {
    const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const context = {
      workspaceId: workspace.workspaceId,
      repository: workspace.repository,
      files: workspace.files,
    };

    // Step 1: send natural-language text to Gemini. Gemini returns either
    // a normal response or a safe, structured DEVSPA action.
    if (command?.type === "assistant_message") {
      const response = await fetch(`${API_URL}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: command.text, history: command.history || [], context }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.error || "Unable to reach DEVSPA AI.");
      }

      return {
        message: body.message || "Iâ€™m ready.",
        tool: body.action
          ? {
              ...body.action,
              name: body.action.type,
              description: body.action.description || body.message || "DEVSPA wants to perform an action.",
            }
          : null,
      };
    }

    // Step 2: execute a previously confirmed Gemini action through the backend
    // validator, then update the DEVSPA UI.
    const action = {
      type: command?.type || command?.name,
      path: command?.path || command?.arguments?.path || "",
    };

    const supported = new Set([
      "open_file",
      "open_explorer",
      "open_debugger",
      "analyze_file",
    ]);

    if (!supported.has(action.type)) {
      throw new Error(`Unsupported assistant action: ${action.type || "unknown"}`);
    }

    const response = await fetch(`${API_URL}/api/assistant/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, context }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success) {
      throw new Error(body.error || "Assistant action failed.");
    }

    if (action.type === "open_explorer") {
      openWindow("explorer");
    } else if (action.type === "open_debugger") {
      openWindow("debugger");
    } else if (action.type === "open_file" || action.type === "analyze_file") {
      const path = String(action.path || "").replace(/^\/+/, "");
      const file = workspace.files.find(
        (item) => String(item.path || item.name || "").replace(/^\/+/, "") === path
      );

      if (!file) {
        throw new Error(`The requested file is not in the current workspace: ${path}`);
      }

      if (action.type === "analyze_file") {
        handleAnalyzeFile({
          workspaceId: workspace.workspaceId,
          repository: workspace.repository,
          files: workspace.files,
          file,
        });
      } else {
        handleAssistantOpenFile(path);
      }
    }

    return { message: body.message || "Done." };
  }, [workspace, openWindow, handleAssistantOpenFile, handleAnalyzeFile]);


  return (
    <main className="relative h-screen w-screen overflow-hidden text-white">
      <Wallpaper />
      <Desktop onOpenWindow={openWindow} />

      <WindowManager
        windows={windows}
        activeWindow={activeWindow}
        onOpenWindow={openWindow}
        onMoveWindow={moveWindow}
        onFocusWindow={focusWindow}
        onCloseWindow={closeWindow}
        onMinimizeWindow={minimizeWindow}
        onMaximizeWindow={maximizeWindow}
        explorerProps={{
          workspaceId: workspace.workspaceId,
          repository: workspace.repository,
          workspaceFiles: workspace.files,
          onWorkspaceChange: handleWorkspaceChange,
          onOpenEditor: handleOpenEditor,
          onOpenDebugger: handleOpenDebugger,
          onAnalyzeFile: handleAnalyzeFile,
        }}
        editorRequest={editorRequest}
        debuggerRequest={debuggerRequest}
        onWorkspaceChange={handleWorkspaceChange}
        onAssistantTool={handleAssistantTool}
        onAssistantOpenFile={handleAssistantOpenFile}
      />

      <Taskbar
        windows={windows}
        activeWindow={activeWindow}
        onOpenWindow={openWindow}
        onFocusWindow={focusWindow}
        onRestoreWindow={restoreWindow}
      />

      {/* Universal DEVSPA dragon-tail cursor. Rendered once at OS-shell level. */}
      <DragonCursor />
    </main>
  );
};

export default Devspa;
