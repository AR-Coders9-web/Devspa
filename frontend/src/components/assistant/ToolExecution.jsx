import React from "react";

const stateCopy = {
  running: "Processing matrix...",
  success: "Execution successful",
  error: "Process terminated",
};

export default function ToolExecution({ tool }) {
  const state = tool?.state || "running";
  const success = state === "success";
  const error = state === "error";

  return (
    <div
      className={`relative animate-[slideUp_.3s_ease-out] overflow-hidden rounded-2xl border bg-[#050508]/70 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-500 ${
        error
          ? "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
          : success
            ? "border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
            : "border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]"
      }`}
    >
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={`grid h-8 w-8 place-items-center rounded-xl border text-[12px] shadow-inner transition-all duration-300 ${
            error
              ? "border-red-500/30 bg-red-500/[0.05] text-red-400 shadow-red-500/10"
              : success
                ? "border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-400 shadow-emerald-500/10"
                : "border-cyan-500/30 bg-cyan-500/[0.05] text-cyan-400 shadow-cyan-500/10"
          }`}
        >
          {error ? "✕" : success ? "✓" : <span className="animate-[spin_3s_linear_infinite]">✧</span>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-semibold tracking-wider text-white/70">
            {tool?.name || tool?.type || "System Process"}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/30">
            {!success && !error && (
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-400/80" />
            )}
            {stateCopy[state] || state}
          </div>
        </div>
      </div>

      {tool?.result?.message && (
        <p className="relative z-10 mt-3 border-t border-white/[0.05] pt-3 text-[9px] leading-5 text-white/40">
          {String(tool.result.message)}
        </p>
      )}
    </div>
  );
}