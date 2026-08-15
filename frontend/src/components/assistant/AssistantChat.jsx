import React, { useEffect, useRef } from "react";
import AssistantMessage from "./AssistantMessage";

function EmptyState({ suggestions, onSuggestion }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 grid h-24 w-24 place-items-center rounded-full border border-cyan-500/20 bg-cyan-500/[0.02] shadow-[0_0_50px_rgba(34,211,238,0.05)]">
        <span className="text-3xl text-cyan-400/80">✦</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-white/90">How can I assist you?</h2>
      <p className="mb-8 text-sm text-white/40">DEVSPA Dragon Core is online and ready.</p>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
        {suggestions.map((item) => (
          <button key={item.label} onClick={() => onSuggestion(item.prompt)} className="group rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/[0.05]">
            <div className="mb-1 text-sm font-medium text-white/80 group-hover:text-cyan-300">{item.label}</div>
            <div className="text-xs text-white/40">{item.prompt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AssistantChat({ messages, thinking, speaking, suggestions, onSuggestion, onOpenFile, onStopSpeaking }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  if (!messages.length) return <div className="h-full overflow-y-auto"><EmptyState suggestions={suggestions} onSuggestion={onSuggestion} /></div>;

  return (
    <div className="h-full overflow-y-auto px-4 py-6 pb-40 scrollbar-thin scrollbar-thumb-white/10 sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {messages.map((msg) => <AssistantMessage key={msg.id} message={msg} onOpenFile={onOpenFile} />)}
        {thinking && (
          <div className="flex items-center gap-3 animate-pulse text-cyan-400/60">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-widest">Processing...</span>
          </div>
        )}
        {speaking && (
          <div className="flex justify-center pt-4">
            <button onClick={onStopSpeaking} className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20">
              Stop Audio
            </button>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}