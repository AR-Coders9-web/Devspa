import React, { useRef, useState } from 'react';
import VoiceButton from './VoiceButton';

export default function DebuggerInput({ onSend, disabled = false, placeholder = 'Ask DEVSPA…' }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setValue('');
  };

  const keyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); }
  };

  const handleTranscript = (text) => {
    if (!text) return;
    setValue((current) => current ? `${current} ${text}` : text);
    ref.current?.focus();
  };

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0d11] p-3">
      <div className="rounded-xl border border-white/[0.09] bg-white/[0.025] shadow-inner transition focus-within:border-white/20 focus-within:bg-white/[0.035]">
        <textarea ref={ref} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={keyDown} disabled={disabled} rows={2} placeholder={placeholder} className="block w-full resize-none bg-transparent px-3.5 pt-3 text-[11px] leading-5 text-white outline-none placeholder:text-white/20 disabled:opacity-40" />
        <div className="flex items-center justify-between px-2.5 pb-2.5">
          <span className="px-1 text-[9px] text-white/20">Enter to send · Shift+Enter for newline</span>
          <div className="flex items-center gap-1.5">
            <VoiceButton onTranscript={handleTranscript} />
            <button type="button" onClick={submit} disabled={!value.trim() || disabled} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[11px] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-20" aria-label="Send message">↑</button>
          </div>
        </div>
      </div>
    </div>
  );
}
