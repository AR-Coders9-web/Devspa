import React, { useRef, useEffect } from "react";
import VoiceButton from "./VoiceButton";

export default function AssistantInput({
  value,
  onChange,
  onSubmit,
  listening,
  setListening,
  onVoiceResult,
  disabled,
  voiceMode,
  onToggleVoiceMode,
  autoStart,
  onVoiceError,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={`relative flex items-end gap-3 rounded-2xl border bg-[#0d1017]/90 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all ${disabled ? "border-white/[0.05] opacity-60" : "border-white/[0.1] focus-within:border-cyan-500/30"}`}>
        <div className="pb-1">
          <VoiceButton listening={listening} setListening={setListening} onResult={onVoiceResult} disabled={disabled}
            voiceMode={voiceMode}
            onToggleVoiceMode={onToggleVoiceMode}
            autoStart={autoStart}
            onError={onVoiceError}
          />
        </div>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || voiceMode}
          placeholder={voiceMode ? "Voice mode active..." : "Ask DEVSPA AI..."}
          className="max-h-[200px] w-full resize-none bg-transparent py-1.5 text-sm text-white outline-none placeholder:text-white/30 scrollbar-thin scrollbar-thumb-white/10"
        />
        <button
          onClick={() => onSubmit()}
          disabled={disabled || voiceMode || !value.trim()}
          className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-black transition-all hover:scale-105 disabled:opacity-20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}