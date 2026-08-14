import React from 'react';

export default function ErrorDetails({ error }) {
  if (!error) return null;
  const rows = [
    ['Type', error.type || 'Error'],
    ['Location', `${error.file || 'Unknown'}:${error.line || '?'}`],
    ['Column', error.column || '—'],
    ['Command', error.command || '—'],
    ['Detected', error.time || '—'],
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.018]">
      <div className="border-b border-white/[0.06] px-3 py-2.5"><h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Details</h3></div>
      <div className="divide-y divide-white/[0.05]">
        {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[90px_1fr] gap-3 px-3 py-2 text-[11px]"><span className="text-white/30">{label}</span><span className="truncate font-mono text-white/60">{value}</span></div>)}
      </div>
    </section>
  );
}
