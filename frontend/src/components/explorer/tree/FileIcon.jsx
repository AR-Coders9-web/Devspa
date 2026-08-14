import React from "react";

const iconMap = {
  js: ["JS", "text-amber-300/55"], jsx: ["JS", "text-cyan-300/55"],
  ts: ["TS", "text-blue-300/60"], tsx: ["TS", "text-blue-300/60"],
  json: ["{}", "text-yellow-200/50"], css: ["#", "text-sky-300/55"],
  scss: ["#", "text-pink-300/50"], html: ["<>", "text-orange-300/55"],
  md: ["M", "text-white/40"], py: ["PY", "text-blue-300/55"],
  java: ["J", "text-red-300/50"], c: ["C", "text-blue-200/50"],
  cpp: ["C+", "text-blue-200/50"], h: ["H", "text-violet-200/50"],
  hpp: ["H+", "text-violet-200/50"], svg: ["◇", "text-orange-200/55"],
  png: ["IMG", "text-emerald-300/45"], jpg: ["IMG", "text-emerald-300/45"],
  jpeg: ["IMG", "text-emerald-300/45"], gif: ["IMG", "text-emerald-300/45"],
  env: ["ENV", "text-purple-300/50"], lock: ["LOCK", "text-white/30"],
};

export default function FileIcon({ path = "", folder = false, expanded = false }) {
  if (folder) {
    return (
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[9px] transition ${expanded ? "bg-amber-300/[0.07] text-amber-200/65" : "text-amber-200/40"}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <path d={expanded
            ? "M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H19A2 2 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"
            : "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"} />
        </svg>
      </span>
    );
  }

  const name = path.split("/").pop() || "";
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const [icon, tone] = iconMap[ext] || ["·", "text-white/30"];

  return <span className={`grid h-5 w-5 shrink-0 place-items-center font-mono text-[7px] font-semibold ${tone}`}>{icon}</span>;
}
