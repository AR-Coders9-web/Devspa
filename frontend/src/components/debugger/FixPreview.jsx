import React from 'react';

export default function FixPreview({ error, open = true, onApply, onReject }) {
  if (!open || !error) return null;
  return (
    <section className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div><h3 className="text-xs font-semibold text-white/80">AI Fix Preview</h3><p className="mt-0.5 text-[9px] text-white/25">{error.file}:{error.line}</p></div>
        <span className="rounded-full border border-amber-300/15 bg-amber-300/5 px-2 py-1 text-[9px] text-amber-200/60">Review first</span>
      </div>
      <div className="space-y-2 p-4">
        <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#07090c] p-3 font-mono text-[10px] leading-6"><div className="text-red-300/75">− {error.codeBefore || 'unsafe property access'}</div><div className="text-emerald-300/75">+ {error.codeAfter || 'safe property access'}</div></div>
        <p className="text-[10px] leading-5 text-white/30">The suggested change is shown as a preview. Apply it only after review, then run the project again to verify the result.</p>
      </div>
      <div className="flex gap-2 px-4 pb-4"><button type="button" onClick={onReject} className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-white/55 hover:bg-white/[0.07] hover:text-white">Reject</button><button type="button" onClick={onApply} className="flex-1 rounded-lg bg-white px-3 py-2 text-[10px] font-semibold text-black hover:bg-white/90">Apply Fix</button></div>
    </section>
  );
}
