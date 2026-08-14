import React, { useRef } from "react";
import SettingsWindow from "../../settings/SettingsWindow";
import CodeEditor from "../editor/CodeEditor";
import DebuggerPanel from "../debugger/DebuggerPanel";
import Explorer from "../explorer/Explorer";
import AIAssistant from "../assistant/AIAssistant";

import {
    X,
    Minus,
    Square,
    Maximize2,
    Code2,
    Terminal,
    Folder,
    Bug,
    Bot,
    Settings,
} from "lucide-react";

const APP_CONFIG = {
    editor: {
        title: "Code Editor",
        icon: Code2,
    },

    terminal: {
        title: "Terminal",
        icon: Terminal,
    },

    explorer: {
        title: "Explorer",
        icon: Folder,
    },

    debugger: {
        title: "Debugger",
        icon: Bug,
    },

    ai: {
        title: "AI Assistant",
        icon: Bot,
    },

    settings: {
    title: "Settings",
    icon: Settings,
},
};

const WindowManager = ({
    windows,
    activeWindow,
    onMoveWindow,
    onFocusWindow,
    onCloseWindow,
    onMinimizeWindow,
    onMaximizeWindow,
    explorerProps,
    editorRequest,
    debuggerRequest,
    onWorkspaceChange,
    onApplyFix,
    onAssistantTool,
    onAssistantOpenFile,
}) => {
    const dragData = useRef(null);


    const handleDragStart = (event, windowData) => {
        if (windowData.maximized) return;
        if (event.button !== 0) return;

        event.preventDefault();

        onFocusWindow(windowData.id);

        dragData.current = {
            id: windowData.id,
            startX: event.clientX,
            startY: event.clientY,
            startWindowX: windowData.x,
            startWindowY: windowData.y,
        };

        document.addEventListener(
            "pointermove",
            handleDragMove
        );

        document.addEventListener(
            "pointerup",
            handleDragEnd,
            { once: true }
        );
    };



    // ==========================================
    // START DRAG
    // ==========================================


    // ==========================================
    // DRAG MOVE
    // ==========================================
    const handleDragMove = (event) => {
        if (!dragData.current) return;

        const {
            id,
            startX,
            startY,
            startWindowX,
            startWindowY,
        } = dragData.current;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        let newX = startWindowX + deltaX;
        let newY = startWindowY + deltaY;

        // ========================================
        // KEEP WINDOW INSIDE SCREEN
        // ========================================

        const minX = 0;
        const minY = 0;

        const maxX =
            window.innerWidth - 150;

        const maxY =
            window.innerHeight - 70;

        newX = Math.max(
            minX,
            Math.min(newX, maxX)
        );

        newY = Math.max(
            minY,
            Math.min(newY, maxY)
        );

        onMoveWindow(
            id,
            newX,
            newY
        );
    };

    // ==========================================
    // END DRAG
    // ==========================================
    const handleDragEnd = () => {
        dragData.current = null;

        window.removeEventListener(
            "pointermove",
            handleDragMove
        );
    };

    return (
        <>
            {windows.map((windowData) => {
                if (windowData.minimized) {
                    return null;
                }

                const config =
                    APP_CONFIG[windowData.id];

                if (!config) {
                    return null;
                }

                const Icon = config.icon;

                const isActive =
                    activeWindow === windowData.id;

                return (
                    <div
                        key={windowData.id}
                        onMouseDown={() =>
                            onFocusWindow(
                                windowData.id
                            )
                        }
                        className={`
              fixed
              overflow-hidden
              rounded-2xl
              border
              bg-[#0b0c0f]/90
              shadow-[0_30px_100px_rgba(0,0,0,0.65)]
              backdrop-blur-2xl
              ${isActive
                                ? "border-white/[0.20]"
                                : "border-white/[0.08]"
                            }
              ${windowData.maximized
                                ? "left-0 top-0 h-screen w-screen rounded-none"
                                : ""
                            }
            `}
                        style={
                            windowData.maximized
                                ? {
                                    zIndex: 200,
                                }
                                : {
                                    left: windowData.x,
                                    top: windowData.y,
                                    width: windowData.width,
                                    height: windowData.height,
                                    zIndex: isActive
                                        ? 200
                                        : 100,
                                }
                        }
                    >

                        {/* =====================================
                WINDOW HEADER / DRAG BAR
            ====================================== */}

                        <header
                            onPointerDown={(event) =>
                                handleDragStart(
                                    event,
                                    windowData
                                )
                            }
                            className="
                flex
                h-12
                select-none
                items-center
                justify-between
                border-b
                border-white/[0.07]
                bg-white/[0.025]
                px-4
                cursor-grab
                active:cursor-grabbing
              "
                        >

                            {/* Window title */}
                            <div className="pointer-events-none flex items-center gap-3">

                                <Icon
                                    size={16}
                                    strokeWidth={1.5}
                                    className="text-white/60"
                                />

                                <span className="text-xs font-medium tracking-wide text-white/80">
                                    {config.title}
                                </span>

                            </div>

                            {/* Window controls */}
                            <div
                                className="flex items-center gap-1"
                                onPointerDown={(event) =>
                                    event.stopPropagation()
                                }
                            >

                                {/* Minimize */}
                                <button
                                    type="button"
                                    onPointerDown={(event) => {
                                        event.stopPropagation();
                                    }}
                                    onClick={() => {
                                        onMinimizeWindow(windowData.id);
                                    }}
                                    className="
    flex h-7 w-7 cursor-pointer
    items-center justify-center
    rounded-md
    text-white/40
    transition-all duration-200
    hover:scale-105 hover:bg-white/10
    hover:text-white
    active:scale-90
  "
                                >
                                    <Minus size={14} />
                                </button>


                                {/* Maximize */}
                                <button
                                    type="button"
                                    onPointerDown={(event) => {
                                        event.stopPropagation();
                                    }}
                                    onClick={() => {
                                        onMaximizeWindow(windowData.id);
                                    }}
                                    className="
    flex h-7 w-7 cursor-pointer
    items-center justify-center
    rounded-md
    text-white/40
    transition-all duration-200
    hover:scale-105 hover:bg-white/10
    hover:text-white
    active:scale-90
  "
                                >
                                    {windowData.maximized ? (
                                        <Square size={12} />
                                    ) : (
                                        <Maximize2 size={13} />
                                    )}
                                </button>

                                {/* Close */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        onCloseWindow(
                                            windowData.id
                                        )
                                    }
                                    className="
                    flex h-7 w-7 cursor-pointer
                    items-center justify-center
                    rounded-md
                    text-white/40
                    transition-all duration-200
                    hover:scale-105 hover:bg-red-500/20
                    hover:text-red-400
                    active:scale-90
                  "
                                >
                                    <X size={14} />
                                </button>

                            </div>
                        </header>

                        {/* =====================================
                WINDOW CONTENT
            ====================================== */}

                        <div className="h-[calc(100%-48px)] overflow-hidden">
                            <WindowContent
                                appId={windowData.id}
                                windowData={windowData}
                                explorerProps={explorerProps}
                                editorRequest={editorRequest}
                                debuggerRequest={debuggerRequest}
                                onWorkspaceChange={onWorkspaceChange}
                                onApplyFix={onApplyFix}
                                onCloseWindow={onCloseWindow}
                                onMinimizeWindow={onMinimizeWindow}
                                onMaximizeWindow={onMaximizeWindow}
                                onAssistantTool={onAssistantTool}
                                onAssistantOpenFile={onAssistantOpenFile}
                            />
                        </div>

                    </div>
                );
            })}
        </>
    );
};

// ==========================================
// WINDOW CONTENT
// ==========================================

const WindowContent = ({
    appId,
    windowData,
    explorerProps,
    editorRequest,
    debuggerRequest,
    onWorkspaceChange,
    onApplyFix,
    onAssistantTool,
    onAssistantOpenFile,
}) => {
    switch (appId) {
        case "editor":
            return (
                <CodeEditor
                    externalRepository={editorRequest?.repository || explorerProps?.repository || null}
                    externalFiles={editorRequest?.files?.length ? editorRequest.files : explorerProps?.workspaceFiles || []}
                    openFileRequest={editorRequest}
                    onWorkspaceChange={onWorkspaceChange}
                />
            );

        case "terminal":
            return (
                <div className="h-full bg-black/30 p-5 font-mono text-xs">
                    <p className="text-white/40">DEVSPA Terminal</p>
                    <p className="mt-4 text-white/70">$<span className="ml-2 text-white/40">Terminal ready...</span></p>
                </div>
            );

        case "explorer": {
            const source = explorerProps || windowData || {};
            return (
                <Explorer
                    files={source.workspaceFiles || source.files || []}
                    workspaceFiles={source.workspaceFiles || source.files || []}
                    workspaceId={source.workspaceId || ""}
                    repository={source.repository || source.repo || null}
                    loading={Boolean(source.loading || source.explorerLoading)}
                    error={source.error || source.explorerError || ""}
                    onRefresh={source.onWorkspaceChange}
                    onImport={source.onWorkspaceChange}
                    onSelectFile={source.onSelectFile}
                    onOpenEditor={source.onOpenEditor}
                    onOpenDebugger={source.onOpenDebugger}
                    onAnalyzeFile={source.onAnalyzeFile}
                    onAnalyze={source.onAnalyzeFile}
                    onRun={source.onRunFile}
                    onCreateFile={source.onCreateFile}
                    onCreateFolder={source.onCreateFolder}
                    onRename={source.onRenameFile}
                    onDelete={source.onDeleteFile}
                    onCopyPath={source.onCopyPath}
                />
            );
        }

        case "debugger":
            return (
                <DebuggerPanel
                    openRequest={debuggerRequest}
                    onRepositoryImport={onWorkspaceChange}
                    onOpenFile={explorerProps?.onOpenEditor}
                    onApplyFix={onApplyFix}
                />
            );

        case "ai":
            return (
                <AIAssistant
                    isOpen
                    showHeader={false}
                    onClose={() => windowData && onCloseWindow?.(windowData.id)}
                    onMinimize={() => windowData && onMinimizeWindow?.(windowData.id)}
                    onMaximize={() => windowData && onMaximizeWindow?.(windowData.id)}
                    onOpenFile={onAssistantOpenFile}
                    onRunTool={onAssistantTool}
                />
            );

        case "settings":
            return <SettingsWindow />;

        default:
            return null;
    }
};

export default WindowManager;