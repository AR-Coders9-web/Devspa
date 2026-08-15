import React, { useState } from "react";

const CodeBlock = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2">
        <span className="text-xs font-mono text-white/50">{lang || "code"}</span>
        <button onClick={handleCopy} className="text-xs text-white/40 hover:text-cyan-300">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-sm font-mono text-cyan-50/90 whitespace-pre">
        {code}
      </div>
    </div>
  );
};

const formatText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-bold text-white/95">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i} className="italic text-white/80">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em] text-cyan-300">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
};

const Markdown = ({ content }) => {
  const chunks = content.split(/(```[\s\S]*?```)/g);
  return chunks.map((chunk, i) => {
    if (chunk.startsWith("```") && chunk.endsWith("```")) {
      const lines = chunk.slice(3, -3).split("\n");
      return <CodeBlock key={i} lang={lines[0].trim()} code={lines.slice(1).join("\n")} />;
    }
    return (
      <div key={i} className="space-y-2 text-sm leading-relaxed">
        {chunk.split("\n").map((line, j) => {
          if (!line.trim()) return <div key={j} className="h-1" />;
          if (line.startsWith("# ")) return <h1 key={j} className="mt-4 text-xl font-bold">{formatText(line.slice(2))}</h1>;
          if (line.startsWith("## ")) return <h2 key={j} className="mt-3 text-lg font-bold">{formatText(line.slice(3))}</h2>;
          if (line.startsWith("- ")) return <li key={j} className="ml-4 list-disc">{formatText(line.slice(2))}</li>;
          return <p key={j}>{formatText(line)}</p>;
        })}
      </div>
    );
  });
};

export default function AssistantMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full animate-[slideUp_0.3s_ease-out] ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-bold ${isUser ? "border-violet-500/20 bg-violet-500/10 text-violet-300" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"}`}>
          {isUser ? "U" : "✦"}
        </div>
        <div className="min-w-0">
          {!isUser && <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/50">DEVSPA AI</div>}
          <div className={`rounded-2xl px-5 py-3 ${isUser ? "bg-white/[0.03] border border-white/[0.05] text-white/90" : "text-white/80"}`}>
            <Markdown content={message.content} />
          </div>
        </div>
      </div>
    </div>
  );
}