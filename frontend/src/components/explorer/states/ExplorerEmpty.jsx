import React from "react";

export default function ExplorerEmpty({ repository, onImport }) {
  return (
    <div className="relative flex h-full min-h-72 items-center justify-center overflow-hidden p-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.018] blur-3xl" />
      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.09] bg-white/[0.025] shadow-[0_12px_40px_rgba(0,0,0,.3)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-white/30" fill="none" stroke="currentColor" strokeWidth="1.25">
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H19a2 2 0 0 1 2 2v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z" />
            <path d="M8 12h8M8 15h5" opacity=".55" />
          </svg>
        </div>
        <div className="mt-5 text-sm font-semibold tracking-tight text-white/80">
          {repository ? "This workspace is empty" : "Your workspace is waiting"}
        </div>
        <p className="mx-auto mt-2 max-w-sm text-[10px] leading-5 text-white/25">
          {repository
            ? "The repository was loaded, but there are no browsable files yet."
            : "Import a GitHub repository to browse its complete structure, open files in the editor, debug them and prepare changes."}
        </p>
        {!repository && onImport && (
          <button
            type="button"
            onClick={onImport}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.12] bg-white px-4 py-2 text-[9px] font-semibold text-black shadow-[0_8px_25px_rgba(255,255,255,.08)] transition hover:bg-white/90 active:scale-[.98]"
          >
            <span>＋</span> Import Repository
          </button>
        )}
        <div className="mx-auto mt-7 grid max-w-sm grid-cols-3 gap-2 text-left">
          {[
            ["⌘", "Open in Editor"],
            ["⚙", "Debug with AI"],
            ["✦", "Analyze Code"],
          ].map(([icon, label]) => (
            <div key={label} className="rounded-lg border border-white/[0.055] bg-white/[0.012] px-2 py-2.5">
              <div className="text-[11px] text-white/25">{icon}</div>
              <div className="mt-1 text-[8px] text-white/20">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
