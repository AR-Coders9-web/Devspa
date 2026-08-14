import React, { useState } from 'react';
import DebuggerMessage from './DebuggerMessage';
import DebuggerInput from './DebuggerInput';

const starter = { id: 'starter', role: 'assistant', content: 'I found the failing location. The value can be undefined before `.name` is read. I can prepare a safe fix and run the project again.', kind: 'analysis' };

export default function DebuggerChat({ error, onSend, onApplyFix, onRunAgain }) {
  const [messages, setMessages] = useState([starter]);
  const [busy, setBusy] = useState(false);

  const send = async (text) => {
    const value = String(text || '').trim();
    if (!value) return;
    const userMessage = { id: `u-${Date.now()}`, role: 'user', content: value };
    setMessages((items) => [...items, userMessage]);
    setBusy(true);
    try {
      const response = await onSend?.(value, { error, messages });
      setMessages((items) => [...items, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response ? (typeof response === 'string' ? response : response.message) : 'I’m ready. Connect the debugger AI service to analyze this workspace error.',
        kind: response?.kind || 'answer',
      }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.06] text-[11px]">✦</span><h3 className="text-xs font-semibold text-white/80">DEVSPA AI</h3></div><p className="mt-1 pl-8 text-[9px] uppercase tracking-[0.16em] text-white/25">Debugger agent</p></div>
        <span className="flex items-center gap-1.5 text-[9px] text-emerald-300/60"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />Ready</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => <DebuggerMessage key={message.id} message={message} error={error} onApplyFix={onApplyFix} onRunAgain={onRunAgain} />)}
        {busy && <div className="flex items-center gap-2 text-[10px] text-white/30"><span className="flex gap-1"><i className="h-1 w-1 animate-bounce rounded-full bg-white/40" /><i className="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:-.1s]" /><i className="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:-.2s]" /></span>Analyzing…</div>}
      </div>
      <DebuggerInput onSend={send} disabled={busy} placeholder="Ask DEVSPA about this error…" />
    </div>
  );
}
