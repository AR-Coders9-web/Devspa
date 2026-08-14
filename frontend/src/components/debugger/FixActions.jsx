import React from 'react';

export default function FixActions({ onReject, onApply }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/10 px-4 py-3">
      <button type="button" onClick={onReject} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-white/55 hover:bg-white/[0.07] hover:text-white">Cancel</button>
      <button type="button" onClick={onApply} className="rounded-lg bg-white px-3 py-2 text-[10px] font-semibold text-black hover:bg-white/90">Apply & Run</button>
    </div>
  );
}
