import React from "react";

export default function ExplorerToolbar({
  query,
  onQueryChange,
  onNewFile,
  onNewFolder,
  onRefresh,
  showHidden,
  onToggleHidden,
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.055] bg-[#0a0d12] px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.07] bg-black/25 px-2.5 transition focus-within:border-white/[0.14] focus-within:bg-white/[0.025]">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder="Search files and folders..."
          aria-label="Search files and folders"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[9px] text-white/75 outline-none placeholder:text-white/20"
        />
        {query && (
          <button type="button" title="Clear search" onClick={() => onQueryChange?.("")}
            className="grid h-5 w-5 cursor-pointer place-items-center rounded text-[11px] text-white/25 hover:bg-white/[0.06] hover:text-white/70">
            ×
          </button>
        )}
        <kbd className="hidden rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 text-[7px] text-white/15 md:block">⌘ K</kbd>
      </div>

      <div className="flex items-center gap-1">
        <ToolButton label={showHidden ? "Hide hidden files" : "Show hidden files"} onClick={onToggleHidden} active={showHidden}>
          {showHidden ? "◉" : "○"}
        </ToolButton>
        <ToolButton label="New file" onClick={onNewFile}>＋</ToolButton>
        <ToolButton label="New folder" onClick={onNewFolder}>▱</ToolButton>
        <ToolButton label="Refresh workspace" onClick={onRefresh}>↻</ToolButton>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, children, active = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-8 w-8 cursor-pointer place-items-center rounded-lg border text-[11px] transition ${
        active
          ? "border-white/[0.08] bg-white/[0.05] text-white/60"
          : "border-transparent text-white/25 hover:border-white/[0.07] hover:bg-white/[0.045] hover:text-white/70"
      }`}
    >
      {children}
    </button>
  );
}
