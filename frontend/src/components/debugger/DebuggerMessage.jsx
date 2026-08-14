import React from 'react';

export default function DebuggerMessage({ message, error, onApplyFix, onRunAgain }) {
  const assistant = message.role === 'assistant';
  return (
    <div className={`flex ${assistant ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-[92%]">
        <div className={`mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] ${assistant ? 'text-white/25' : 'justify-end text-white/20'}`}>{assistant ? 'DEVSPA AI' : 'You'}</div>
        <div className={`rounded-xl border px-3.5 py-3 text-[11px] leading-5 ${assistant ? 'border-white/[0.07] bg-white/[0.025] text-white/65' : 'border-white/10 bg-white/[0.07] text-white/80'}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          {assistant && message.kind === 'analysis' && <>
            <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.06] bg-black/20">
              <div className="border-b border-white/[0.06] px-2.5 py-2 text-[9px] uppercase tracking-[0.14em] text-white/25">Suggested change</div>
              <div className="space-y-1 p-2.5 font-mono text-[10px]"><div className="text-red-300/70">− {error?.codeBefore || 'unsafe property access'}</div><div className="text-emerald-300/70">+ {error?.codeAfter || 'safe property access'}</div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={onApplyFix} className="rounded-md bg-white px-2.5 py-1.5 text-[10px] font-semibold text-black transition hover:bg-white/90">Apply Fix</button>
              <button type="button" onClick={onRunAgain} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] text-white/55 transition hover:bg-white/[0.08] hover:text-white">Run Again</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
