import React from "react";

const formatTime = (time) => {
  if (!time) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(time));
  } catch {
    return "";
  }
};

export default function AssistantMessage({ message, onOpenFile }) {
  const user = message?.role === "user";
  const content = String(message?.content ?? "");

  return (
    <article
      className={`flex animate-[messageIn_.28s_ease-out] ${
        user ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`flex max-w-[92%] gap-2.5 sm:max-w-[78%] ${user ? "flex-row-reverse" : ""}`}>
        <div
          className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[9px] ${
            user
              ? "border-white/10 bg-white/[0.045] text-white/40"
              : "border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-200"
          }`}
        >
          {!user && (
            <span className="absolute -inset-1 rounded-full border border-cyan-300/10 animate-pulse" />
          )}
          {user ? "U" : "✦"}
        </div>

        <div className={user ? "items-end" : "items-start"}>
          {!user && (
            <div className="mb-1 px-1 text-[7px] font-semibold uppercase tracking-[0.18em] text-cyan-200/25">
              DEVSPA
            </div>
          )}

          <div
            className={`rounded-2xl border px-3.5 py-2.5 text-[10px] leading-5 shadow-lg shadow-black/10 ${
              user
                ? "rounded-tr-md border-violet-300/15 bg-violet-500/[0.08] text-white/75"
                : "rounded-tl-md border-cyan-300/[0.07] bg-white/[0.025] text-white/65"
            }`}
          >
            {content}
          </div>

          <div className={`mt-1 px-1 text-[7px] text-white/15 ${user ? "text-right" : ""}`}>
            {formatTime(message?.time)}
          </div>

          {message?.file && (
            <button
              type="button"
              onClick={() => onOpenFile?.(message.file)}
              className="mt-1.5 cursor-pointer rounded-lg border border-cyan-300/[0.08] bg-cyan-300/[0.025] px-2.5 py-1.5 text-[8px] text-cyan-200/60 transition-all duration-200 hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] active:scale-[.98]"
            >
              Open {message.file}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}