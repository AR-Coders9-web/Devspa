import React from 'react';

const map = {
  ready: ['READY', 'bg-emerald-400', 'text-emerald-300'],
  error: ['ERROR', 'bg-red-400', 'text-red-300'],
  running: ['RUNNING', 'bg-sky-400', 'text-sky-300'],
  analyzing: ['ANALYZING', 'bg-amber-400', 'text-amber-300'],
  fixing: ['FIXING', 'bg-violet-400', 'text-violet-300'],
  resolved: ['RESOLVED', 'bg-emerald-400', 'text-emerald-300'],
};

export default function DebugStatus({ status = 'ready', compact = false }) {
  const [label, dot, text] = map[status] || map.ready;
  return <span className={`inline-flex items-center gap-1.5 ${text} ${compact ? 'text-[9px]' : 'text-[10px]'}`}><i className={`h-1.5 w-1.5 rounded-full ${dot} ${['running', 'analyzing', 'fixing'].includes(status) ? 'animate-pulse' : ''}`} />{label}</span>;
}
