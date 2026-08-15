import React from "react";

export default function AssistantHeader({ status, voiceMode, onToggleVoiceMode, isSidebarOpen, setIsSidebarOpen, onClose }) {
  const isBusy = ["Thinking", "Listening", "Speaking"].includes(status);

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.05] bg-[#0a0a0c]/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="text-white/40 hover:text-white transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex h-6 w-6 items-center justify-center">
            {isBusy && <span className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" />}
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold tracking-[0.15em] text-white/90">DEVSPA AI</h1>
            <div className="text-[9px] uppercase tracking-widest text-white/40">{status}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onToggleVoiceMode} className={`rounded border px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition ${voiceMode ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-white/10 text-white/40 hover:bg-white/[0.05]"}`}>
          {voiceMode ? "Voice ON" : "Voice"}
        </button>
        {onClose && <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>}
      </div>
    </header>
  );
}