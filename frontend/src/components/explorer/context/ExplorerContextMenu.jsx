import React, { useEffect, useRef } from "react";

export default function ExplorerContextMenu({
  menu, onClose, onOpenEditor, onOpenDebugger, onAnalyze, onRun,
  onCopyPath, onRename, onDelete, onCreateFile, onCreateFolder,
}) {
  const ref = useRef(null);
  const isFolder = menu?.target?.type === "folder";
  const isFile = !isFolder && menu?.target?.path;

  useEffect(() => {
    const close = () => onClose?.();
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  if (!menu) return null;

  const Item = ({ icon, children, shortcut, onClick, danger = false }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[9px] transition ${
        danger ? "text-red-300/70 hover:bg-red-400/10 hover:text-red-200" : "text-white/60 hover:bg-white/[0.07] hover:text-white/90"
      }`}
    >
      <span className="grid w-4 place-items-center text-[10px] text-white/30">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <kbd className="text-[7px] text-white/15">{shortcut}</kbd>}
    </button>
  );

  return (
    <div
      ref={ref}
      onMouseDown={(event) => event.stopPropagation()}
      className="fixed z-[2000] w-60 overflow-hidden rounded-xl border border-white/[0.11] bg-[#11151b]/95 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.6)] backdrop-blur-2xl"
      style={{ left: menu.x, top: menu.y }}
    >
      <div className="border-b border-white/[0.06] px-2 pb-1.5 pt-1">
        <div className="truncate text-[8px] font-semibold uppercase tracking-[0.13em] text-white/25">
          {isFile ? "File" : isFolder ? "Folder" : "Workspace"}
        </div>
        <div className="mt-0.5 truncate text-[9px] text-white/55">{menu.target?.name || "Workspace"}</div>
      </div>

      <div className="pt-1">
        {isFile && <>
          <Item icon="⌘" onClick={onOpenEditor}>Open with Editor</Item>
          <Item icon="⚙" onClick={onOpenDebugger}>Open with Debugger</Item>
          <Item icon="✦" onClick={onAnalyze}>Analyze with AI</Item>
          <Item icon="▶" onClick={onRun}>Run File</Item>
          <Divider />
          <Item icon="⌁" onClick={onCopyPath}>Copy Path</Item>
          <Item icon="✎" onClick={onRename}>Rename</Item>
          <Item icon="⌫" onClick={onDelete} danger>Delete</Item>
        </>}

        {isFolder && <>
          <Item icon="▱" onClick={onCreateFile}>New File</Item>
          <Item icon="▰" onClick={onCreateFolder}>New Folder</Item>
          <Divider />
          <Item icon="⌁" onClick={onCopyPath}>Copy Path</Item>
          <Item icon="✎" onClick={onRename}>Rename</Item>
          <Item icon="⌫" onClick={onDelete} danger>Delete</Item>
        </>}

        {!isFile && !isFolder && <>
          <Item icon="＋" onClick={onCreateFile}>New File</Item>
          <Item icon="▱" onClick={onCreateFolder}>New Folder</Item>
          <Divider />
          <Item icon="↻" onClick={onClose}>Close Menu</Item>
        </>}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-1.5 border-t border-white/[0.06]" />;
}
