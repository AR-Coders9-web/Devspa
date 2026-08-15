import React from "react";

export default function VoiceVisualizer({ active }) {
  return (
    <div className={`flex h-16 items-center justify-center gap-1.5 transition-all duration-500 ${active ? "opacity-100" : "opacity-0"}`}>
      {Array.from({ length: 15 }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${i * 40}ms`, height: `${8 + ((i * 12) % 20)}px` }} className={`w-1 rounded-full bg-cyan-400 ${active ? "animate-[pulse_0.8s_ease-in-out_infinite]" : ""}`} />
      ))}
    </div>
  );
}