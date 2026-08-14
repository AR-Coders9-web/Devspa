import React, { useEffect, useRef } from "react";
import AssistantMessage from "./AssistantMessage";

function JarvisCore({ active = false }) {
  return (
    <div className="relative mx-auto mb-7 h-28 w-28">
      <div className={`absolute inset-0 rounded-full border border-cyan-300/10 ${active ? "animate-ping" : ""}`} />
      <div className="absolute -inset-4 rounded-full border border-violet-300/[0.05] animate-[spin_14s_linear_infinite]" />
      <div className="absolute inset-2 rounded-full border border-cyan-300/15 animate-[spin_9s_linear_infinite_reverse]" />
      <div className="absolute inset-6 rounded-full border border-cyan-200/20 bg-cyan-300/[0.025] shadow-[0_0_55px_rgba(34,211,238,.10)]" />
      <div className="absolute inset-[34px] rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(103,232,249,.95),0_0_55px_rgba(59,130,246,.25)]" />
      <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.9)]" />
      <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,.8)]" />
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-300/70" />
      <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-300/70" />
    </div>
  );
}

function EmptyState({ suggestions, onSuggestion }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(103,232,249,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.035)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="mb-3 text-[7px] font-semibold uppercase tracking-[0.42em] text-cyan-200/25">
          DEVSPA // AUTONOMOUS ASSISTANT
        </div>

        <JarvisCore />

        <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-[7px] uppercase tracking-[0.28em] text-emerald-300/45">
          <span className="h-1 w-1 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.8)]" />
          System online
          <span className="h-px w-8 bg-emerald-300/10" />
          Neural link stable
        </div>

        <h2 className="text-center text-xl font-medium tracking-[0.08em] text-white/90">
          How may I assist?
        </h2>

        <p className="mx-auto mt-2 max-w-md text-center text-[10px] leading-5 text-white/30">
          I can inspect your workspace, investigate errors, find files, run approved tools,
          and help you build.
        </p>

        <div className="mx-auto mt-7 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {suggestions.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSuggestion(item.prompt)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-cyan-300/[0.07] bg-white/[0.018] p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-cyan-300/[0.035] hover:shadow-[0_0_28px_rgba(34,211,238,.06)]"
            >
              <span className="absolute left-0 top-0 h-px w-8 bg-cyan-200/30 transition-all duration-300 group-hover:w-full" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[7px] uppercase tracking-[0.18em] text-cyan-200/20">
                    Protocol 0{index + 1}
                  </span>
                  <span className="mt-1 block text-[10px] font-medium text-white/55 group-hover:text-white/85">
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] text-cyan-200/20 transition group-hover:translate-x-0.5 group-hover:text-cyan-200/70">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AssistantChat({
  messages = [],
  thinking = false,
  speaking = false,
  suggestions = [],
  onSuggestion,
  onOpenFile,
  onStopSpeaking,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking, speaking]);

  if (!messages.length) {
    return (
      <div className="relative h-full overflow-y-auto">
        <EmptyState suggestions={suggestions} onSuggestion={onSuggestion} />
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto overscroll-contain px-3 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:px-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.map((message) => (
          <AssistantMessage
            key={message.id}
            message={message}
            onOpenFile={onOpenFile}
          />
        ))}

        {thinking && (
          <div className="flex items-center gap-2 px-1">
            <div className="relative grid h-7 w-7 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/[0.05]">
              <span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.8)] animate-pulse" />
            </div>
            <div className="rounded-xl border border-cyan-300/[0.07] bg-white/[0.018] px-3 py-2">
              <div className="flex items-center gap-1.5">
                {[0, 120, 240].map((delay) => (
                  <span
                    key={delay}
                    style={{ animationDelay: `${delay}ms` }}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200/60"
                  />
                ))}
              </div>
            </div>
            <span className="text-[7px] uppercase tracking-[0.2em] text-cyan-200/25">
              Processing
            </span>
          </div>
        )}

        {speaking && (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onStopSpeaking}
              className="rounded-full border border-red-300/15 bg-red-300/[0.04] px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-red-200/70 hover:bg-red-300/10"
            >
              ■ Stop speaking
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}