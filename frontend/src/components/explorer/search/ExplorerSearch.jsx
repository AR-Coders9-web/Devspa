import React from "react";

export default function ExplorerSearch({ value, resultCount, onChange }) {
  if (!value) return null;

  return (
    <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-white/[0.045] bg-white/[0.012] px-3 text-[8px] text-white/25">
      <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
      <span>{resultCount} result{resultCount === 1 ? "" : "s"} for</span>
      <span className="max-w-[260px] truncate text-white/45">“{value}”</span>
      <button
        type="button"
        onClick={() => onChange?.("")}
        className="ml-auto cursor-pointer rounded px-1.5 py-0.5 text-white/20 transition hover:bg-white/[0.06] hover:text-white/65"
      >
        Clear
      </button>
    </div>
  );
}
