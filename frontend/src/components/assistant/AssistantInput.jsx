import React, { useRef } from "react";
import VoiceButton from "./VoiceButton";

export default function AssistantInput({
  value,
  onChange,
  onSubmit,
  listening,
  setListening,
  onVoiceResult,
  disabled = false,
  voiceMode = false,
  autoStartVoice = false,
  onToggleVoiceMode,
}) {
  const inputRef = useRef(null);
  const submit = () => onSubmit?.(value, { voice: false });

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={`group relative flex min-h-12 items-center gap-2 rounded-2xl border bg-[#080c12]/90 px-2.5 py-2 shadow-[0_12px_50px_rgba(0,0,0,.28)] transition-all duration-300 ${
          disabled
            ? "border-white/[0.05] opacity-70"
            : "border-cyan-300/[0.09] focus-within:border-cyan-300/25 focus-within:bg-cyan-300/[0.025] focus-within:shadow-[0_0_35px_rgba(34,211,238,.05)]"
        }`}
      >
        <span className="pointer-events-none absolute left-4 top-0 h-px w-16 bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent transition-all duration-500 group-focus-within:w-32" />

        <VoiceButton
          listening={listening}
          disabled={disabled}
          setListening={setListening}
          onResult={onVoiceResult}
          voiceMode={voiceMode}
          autoStart={autoStartVoice}
          onToggleVoiceMode={onToggleVoiceMode}
        />

        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          disabled={disabled || voiceMode}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            voiceMode ? "Voice channel active — speak naturally..." : "Ask DEVSPA anything..."
          }
          className="max-h-28 min-h-7 flex-1 resize-none bg-transparent px-1 py-1 text-[10px] leading-5 text-white/80 outline-none placeholder:text-white/20 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || voiceMode || !String(value || "").trim()}
          aria-label="Send message"
          title="Send message"
          className="group/send relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-cyan-200/15 bg-cyan-100/[0.92] text-black transition-all hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-20"
        >
          <span className="absolute inset-0 translate-y-full bg-cyan-200 transition-transform duration-300 group-hover/send:translate-y-0" />
          <span className="relative text-[13px]">↑</span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-[7px] uppercase tracking-[0.18em] text-white/15">
        <span className="h-px w-8 bg-white/[0.05]" />
        Secure neural channel
        <span className="h-px w-8 bg-white/[0.05]" />
      </div>
    </div>
  );
}