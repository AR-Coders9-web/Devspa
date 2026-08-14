import React from 'react';

const icon = { done: '✓', error: '!', idle: '·' };

export default function DebugTimeline({ items = [] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.018]">
      <div className="border-b border-white/[0.06] px-3 py-2.5"><h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Debug Session</h3></div>
      <div className="p-4">
        {items.map((item, index) => <div key={`${item.label}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-white/[0.07]" />}
          <span className={`relative z-10 grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[8px] ${item.state === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-300' : item.state === 'done' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-white/25'}`}>{icon[item.state] || '·'}</span>
          <div className="min-w-0 pt-0.5"><div className="text-[11px] text-white/65">{item.label}</div><div className="mt-0.5 truncate font-mono text-[9px] text-white/25">{item.meta}</div></div>
        </div>)}
      </div>
    </section>
  );
}
