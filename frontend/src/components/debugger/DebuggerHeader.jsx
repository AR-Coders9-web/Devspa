import React from 'react';
import DebugStatus from './DebugStatus';

export default function DebuggerHeader({ error, status = 'ready', onClear }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0b0e13]/95 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-300">!</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-white">Debugger</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-white/40">DEVSPA</span>
          </div>
          <p className="truncate text-[10px] text-white/35">{error ? `${error.file}:${error.line}` : 'Workspace diagnostics'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DebugStatus status={status} compact />
        {onClear && <button type="button" onClick={onClear} className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/55 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:block">Clear</button>}
      </div>
    </header>
  );
}
