import React, { useState } from 'react';

export default function StackTrace({ frames = [], onSelect }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.018]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between border-b border-white/[0.06] px-3 py-2.5 text-left">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Stack Trace</span><span className="text-[10px] text-white/25">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && <div className="divide-y divide-white/[0.045]">
        {frames.length ? frames.map((frame, index) => (
          <button type="button" key={`${frame.file}-${frame.line}-${index}`} onClick={() => onSelect?.(frame)} className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.04]">
            <span className="w-5 shrink-0 text-center font-mono text-[9px] text-white/20">{index + 1}</span>
            <div className="min-w-0 flex-1"><div className="truncate font-mono text-[11px] text-white/60 group-hover:text-white/90">{frame.function || '<anonymous>'}</div><div className="truncate font-mono text-[9px] text-white/25">{frame.file}:{frame.line}</div></div>
            <span className="text-white/15 transition group-hover:translate-x-0.5 group-hover:text-white/50">›</span>
          </button>
        )) : <div className="px-3 py-5 text-center text-[11px] text-white/25">No stack frames captured.</div>}
      </div>}
    </section>
  );
}
