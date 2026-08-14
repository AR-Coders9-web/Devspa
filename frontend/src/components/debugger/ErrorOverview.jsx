import React from 'react';

export default function ErrorOverview({ error }) {
  if (!error) return null;
  return (
    <article className="overflow-hidden rounded-xl border border-red-400/15 bg-gradient-to-br from-red-400/[0.09] via-[#101319] to-[#0d1015]">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-300">!</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">Runtime Error</span>
            <span className="rounded-full border border-red-400/15 bg-red-400/5 px-2 py-0.5 text-[9px] text-red-200/70">{error.type || 'Error'}</span>
          </div>
          <h3 className="break-words text-sm font-medium leading-6 text-white/90">{error.message}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/35">
            <span>{error.file}</span><span>Line {error.line}</span>{error.column && <span>Col {error.column}</span>}{error.command && <span>{error.command}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
