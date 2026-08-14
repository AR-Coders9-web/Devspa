import React from "react";

const stateCopy = {
  running: "Running tool…",
  success: "Completed",
  error: "Failed",
};

export default function ToolExecution({ tool }) {
  const state = tool?.state || "running";
  const success = state === "success";
  const error = state === "error";

  return (
    <div
      className={`animate-[slideUp_.22s_ease-out] rounded-2xl border bg-[#0d1016]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl ${
        error
          ? "border-red-400/15"
          : success
            ? "border-emerald-400/15"
            : "border-violet-400/15"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] ${
            error
              ? "bg-red-400/[0.08] text-red-300"
              : success
                ? "bg-emerald-400/[0.08] text-emerald-300"
                : "bg-violet-400/[0.08] text-violet-300"
          }`}
        >
          {error ? "×" : success ? "✓" : "✦"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[9px] font-medium text-white/60">
            {tool?.name || tool?.type || "DEVSPA tool"}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[8px] text-white/25">
            {!success && !error && (
              <span className="h-1 w-1 animate-pulse rounded-full bg-violet-300" />
            )}
            {stateCopy[state] || state}
          </div>
        </div>
      </div>

      {tool?.result?.message && (
        <p className="mt-2 border-t border-white/[0.05] pt-2 text-[8px] leading-4 text-white/30">
          {String(tool.result.message)}
        </p>
      )}
    </div>
  );
}
