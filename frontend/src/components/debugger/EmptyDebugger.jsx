import React from 'react';

export default function EmptyDebugger({ onRun }) {
  return (
    <div className="grid h-full min-h-[420px] place-items-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-2xl shadow-2xl shadow-black/30">◌</div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">Debugger Ready</div>
        <h3 className="text-lg font-medium text-white/80">Your workspace is healthy.</h3>
        <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-white/30">Run your project to capture terminal errors, stack traces and diagnostics here.</p>
        <button type="button" onClick={onRun} className="mt-5 rounded-lg bg-white px-4 py-2.5 text-[11px] font-semibold text-black transition hover:bg-white/90">▶ Run Project</button>
      </div>
    </div>
  );
}
