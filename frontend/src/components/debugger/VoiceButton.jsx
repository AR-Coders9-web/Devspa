import React, { useState } from 'react';

export default function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const toggle = () => {
    if (!supported) return;
    if (listening) { setListening(false); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (text) onTranscript?.(text);
    };
    recognition.start();
  };

  return (
    <button type="button" onClick={toggle} disabled={!supported} title={supported ? (listening ? 'Stop listening' : 'Voice input') : 'Voice input is not supported by this browser'} className={`grid h-7 w-7 place-items-center rounded-lg border text-[11px] transition ${listening ? 'border-red-400/30 bg-red-400/10 text-red-300 shadow-[0_0_18px_rgba(248,113,113,.12)]' : 'border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.07] hover:text-white'} disabled:cursor-not-allowed disabled:opacity-25`} aria-label="Voice input">{listening ? '■' : '◉'}</button>
  );
}
