import React from 'react';

const tabs = [['overview', 'Overview'], ['timeline', 'Timeline'], ['fix', 'Fix']];

export default function DebuggerToolbar({ status = 'ready', activeTab = 'overview', onTabChange, onRun, onClear, onOpenFix }) {
  const busy = status === 'running' || status === 'fixing' || status === 'analyzing';
  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0d11] px-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" onClick={() => onTabChange?.(id)} className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] transition ${activeTab === id ? 'bg-white/[0.08] text-white shadow-inner' : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'}`}>{label}</button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" disabled={busy} onClick={onRun} className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-400/[0.14] disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Running…' : '▶ Run Again'}</button>
        <button type="button" onClick={onOpenFix} className="hidden rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/[0.07] hover:text-white sm:block">✦ Preview Fix</button>
        <button type="button" onClick={onClear} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-white/45 transition hover:bg-white/[0.07] hover:text-white" aria-label="Clear debugger">×</button>
      </div>
    </div>
  );
}
