import React from "react";

export default function VoiceVisualizer({ active = false, bars = 21 }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-16 items-center justify-center gap-1 transition-all duration-500 ${
        active ? "opacity-100" : "opacity-30"
      }`}
    >
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={index}
          style={{
            animationDelay: `${index * 45}ms`,
            height: `${8 + ((index * 17) % 25)}px`,
          }}
          className={`w-0.5 rounded-full bg-violet-300/50 ${
            active ? "animate-[voiceBar_.8s_ease-in-out_infinite]" : ""
          }`}
        />
      ))}
    </div>
  );
}
