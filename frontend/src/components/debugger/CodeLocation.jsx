import React from 'react';

export default function CodeLocation({ error, onOpenFile }) {
  if (!error) return null;
  const line = Number(error.line) || 42;
  const before = error.codeBefore || 'const name = user.name;';
  const after = error.codeAfter || 'const name = user?.name;';
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#080a0e]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <h3 className="truncate font-mono text-[10px] text-white/55">{error.file || 'Unknown file'}</h3>
        <button type="button" onClick={() => onOpenFile?.(error.file, line)} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/45 transition hover:bg-white/[0.08] hover:text-white">Open in editor</button>
      </div>
      <div className="overflow-x-auto p-2 font-mono text-[11px] leading-6">
        <div className="grid grid-cols-[42px_1fr] rounded-md bg-white/[0.015]"><span className="select-none border-r border-white/[0.04] pr-3 text-right text-white/20">{line - 1}</span><code className="px-3 text-white/35">{before}</code></div>
        <div className="grid grid-cols-[42px_1fr] rounded-md border border-red-400/10 bg-red-400/[0.06]"><span className="select-none border-r border-red-400/10 pr-3 text-right text-red-300/70">{line}</span><code className="px-3 text-red-100/90">{before}</code></div>
        <div className="grid grid-cols-[42px_1fr] rounded-md bg-emerald-400/[0.025]"><span className="select-none border-r border-white/[0.04] pr-3 text-right text-emerald-300/30">+</span><code className="px-3 text-emerald-200/60">{after}</code></div>
      </div>
    </section>
  );
}
