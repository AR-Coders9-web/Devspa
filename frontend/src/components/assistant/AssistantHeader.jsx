import React from "react";

const StatusDot = ({ status }) => {
  const active = status === "Online" || status === "Voice mode";
  const busy = status === "Thinking" || status === "Listening" || status === "Speaking";

  return (
    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
      {busy && (
        <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-300/30" />
      )}
      <span
        className={`relative h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-300" : busy ? "bg-cyan-300" : "bg-violet-300"
        }`}
      />
    </span>
  );
};

export default function AssistantHeader({
  status = "Online",
  voiceMode = false,
  speaking = false,
  onToggleVoiceMode,
  onStopSpeaking,
}) {
  return (
    <header className="relative z-10 flex h-12 shrink-0 items-center border-b border-cyan-300/[0.07] bg-[#070a0f]/95 px-3 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {/* Compact AI core — window controls intentionally live in the outer shell. */}
        <div className="relative grid h-7 w-7 shrink-0 place-items-center">
          <span className="absolute inset-0 rounded-full border border-cyan-300/20 animate-[spin_8s_linear_infinite]" />
          <span className="absolute inset-1 rounded-full border border-violet-300/20 animate-[spin_5s_linear_infinite_reverse]" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,.9)]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[11px] font-semibold tracking-[0.16em] text-white/90">
              DEVSPA AI
            </h1>
            <span className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.03] px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] text-cyan-200/35">
              DRAGON CORE
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.12em] text-white/30">
            <StatusDot status={status} />
            <span>{status}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="hidden text-[7px] uppercase tracking-[0.16em] text-cyan-200/20 sm:inline">
          Neural link
        </span>

        <button
          type="button"
          onClick={onToggleVoiceMode}
          disabled={status === "Thinking"}
          className={`rounded-lg border px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.14em] transition ${
            voiceMode
              ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(103,232,249,.08)]"
              : "border-white/[0.07] text-white/30 hover:border-cyan-300/15 hover:bg-cyan-300/[0.04] hover:text-cyan-100/70"
          }`}
        >
          {voiceMode ? "Voice ON" : "Voice"}
        </button>

        {speaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="rounded-lg border border-red-300/15 bg-red-300/[0.05] px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.12em] text-red-200/75 transition hover:bg-red-300/10"
          >
            Stop
          </button>
        )}
      </div>
    </header>
  );
}