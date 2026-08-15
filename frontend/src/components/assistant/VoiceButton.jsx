import React, { useEffect, useRef } from "react";

export default function VoiceButton({
  listening = false,
  disabled = false,
  setListening,
  onResult,
  voiceMode = false,
  onToggleVoiceMode,
  autoStart = false,
  onError,
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
    if (
      disabled ||
      !SpeechRecognition ||
      startingRef.current ||
      recognitionRef.current ||
      listening
    ) {
      if (!SpeechRecognition && !disabled) {
        onError?.("Voice input is not supported in this browser.");
      }
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
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

      const text =
        event.results?.[0]?.[0]?.transcript?.trim?.() || "";

      if (text) {
        onResult?.(text);
      }
    };

    recognition.onerror = (event) => {
      startingRef.current = false;
      recognitionRef.current = null;
      setListening?.(false);

      // "no-speech" and "aborted" are normal recognition outcomes.
      if (event?.error !== "no-speech" && event?.error !== "aborted") {
        onError?.(
          event?.error === "not-allowed"
            ? "Microphone permission was denied."
            : "Voice input could not start. Please try again."
        );
      }
    };

    recognition.onend = () => {
      startingRef.current = false;
      recognitionRef.current = null;
      setListening?.(false);
    };

    try {
      recognition.start();
    } catch (error) {
      startingRef.current = false;
      recognitionRef.current = null;
      setListening?.(false);
      onError?.(error?.message || "Voice input could not start.");
    }
  };

  // Voice mode controls the microphone automatically.
  // It starts when voice mode becomes ready and stops while an AI turn
  // is processing/speaking because AIAssistant controls autoStart.
  useEffect(() => {
    if (autoStart) {
      start();
    } else if (listening) {
      stop();
    }

    // autoStart is intentionally the only trigger for automatic listening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    if (disabled) return;

    // In voice mode, clicking toggles voice mode itself.
    // When voice mode is enabled, autoStart above begins recognition.
    if (voiceMode) {
      if (listening) stop();
      onToggleVoiceMode?.();
      return;
    }

    if (listening) stop();
    else start();
  };

  const active = listening || voiceMode;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={
        voiceMode
          ? "Turn off voice mode"
          : listening
            ? "Stop voice input"
            : "Start voice input"
      }
      title={
        voiceMode
          ? "Turn off voice mode"
          : listening
            ? "Stop listening"
            : "Start voice input"
      }
      className={`group relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-200 ${
        active
          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-white/[0.02] text-white/45 hover:border-cyan-400/25 hover:bg-cyan-400/[0.05] hover:text-cyan-200"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {active && (
        <>
          <span className="absolute inset-0 rounded-xl border border-cyan-300/20 animate-ping" />
          <span className="absolute -inset-1 rounded-2xl bg-cyan-400/5 blur-md" />
        </>
      )}

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10"
        aria-hidden="true"
      >
        <rect x="9" y="2.5" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
        <path d="M12 18v3.5" />
        <path d="M8.5 21.5h7" />
      </svg>

      {listening && (
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
      )}
    </button>
  );
}
