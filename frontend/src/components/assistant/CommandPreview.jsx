import React from "react";

export default function CommandPreview({ command, onConfirm, onCancel }) {
  return (
    <div className="animate-[slideUp_0.3s_ease-out] rounded-2xl border border-amber-500/20 bg-[#0a0a0c]/80 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <span className="animate-pulse font-mono font-bold">!</span>
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Authorization Needed</div>
          <div className="mt-1 text-sm font-medium text-amber-400">{command?.name || "System Action"}</div>
          <p className="mt-1 text-xs text-white/40">{command?.description || "DEVSPA is requesting permission to execute."}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-[10px] font-bold tracking-widest text-white/40 hover:bg-white/[0.05]">CANCEL</button>
        <button onClick={onConfirm} className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-[10px] font-bold tracking-widest text-amber-400 hover:bg-amber-500/20">CONFIRM</button>
      </div>
    </div>
  );
}