import React, { useEffect, useRef } from "react";

export default function VoiceButton({
  listening = false,
  disabled = false,
  setListening,
  onResult,
  voiceMode = false,
  autoStart = false,
  onToggleVoiceMode,
}) {
  const recognitionRef = useRef(null);
  const startingRef = useRef(false);
  const handledResultRef = useRef(false);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const stop = () => {
    startingRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    setListening?.(false);
  };

  const start = () => {
    if (disabled || !SpeechRecognition || startingRef.current || listening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    handledResultRef.current = false;
    startingRef.current = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      startingRef.current = false;
      setListening?.(true);
    };

    recognition.onresult = (event) => {
      if (handledResultRef.current) return;
      handledResultRef.current = true;
      const text = event.results?.[0]?.[0]?.transcript || "";
      if (text.trim()) onResult?.(text.trim());
    };

    recognition.onerror = () => {
      startingRef.current = false;
      recognitionRef.current = null;
      setListening?.(false);
    };

    recognition.onend = () => {
      startingRef.current = false;
      recognitionRef.current = null;
      setListening?.(false);
    };

    try {
      recognition.start();
    } catch {
      startingRef.current = false;
      recognitionRef.current = null;
      setListening?.(false);
    }
  };

  useEffect(() => {
    if (!autoStart) {
      if (listening && !voiceMode) stop();
      return undefined;
    }

    start();
    return undefined;
    // autoStart is deliberately the gate: it becomes true only after the
    // previous answer + TTS has completed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useEffect(() => () => stop(), []);

  const handleClick = () => {
    if (disabled) return;

    // In voice mode the button is a pause/resume control.
    if (voiceMode) {
      if (listening) {
        stop();
        onToggleVoiceMode?.();
      } else {
        onToggleVoiceMode?.();
      }
      return;
    }

    if (listening) stop();
    else start();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={voiceMode ? "Stop voice mode" : listening ? "Stop voice input" : "Start voice input"}
      title={voiceMode ? "Stop voice mode" : listening ? "Stop listening" : "Start voice input"}
      className={`relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-xl transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-25 ${
        voiceMode
          ? "bg-violet-400/15 text-violet-300 shadow-[0_0_25px_rgba(167,139,250,.15)]"
          : listening
            ? "bg-violet-400/15 text-violet-300 shadow-[0_0_25px_rgba(167,139,250,.15)]"
            : "text-white/30 hover:bg-white/[0.06] hover:text-white/70 hover:scale-105"
      }`}
    >
      {listening && <span className="absolute inset-1 animate-pulse rounded-lg border border-violet-300/20" />}
      <span className="relative text-[13px]">⌁</span>
    </button>
  );
}
