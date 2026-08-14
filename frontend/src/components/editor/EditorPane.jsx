import React from 'react';
import Editor from '@monaco-editor/react';

const IMAGE_EXTENSIONS = ['png','jpg','jpeg','gif','webp','bmp','ico','avif','svg'];
const isImageFile = (file) => file?.isImage || IMAGE_EXTENSIONS.includes(String(file?.name || '').split('.').pop()?.toLowerCase());

export default function EditorPane({ activeFile, content = '', language = 'plaintext', onChange, readOnly = false }) {
  if (!activeFile) return <div className="flex h-full items-center justify-center bg-[#0b0c0f] text-sm text-white/25">No file selected</div>;
  if (isImageFile(activeFile)) {
    const src = activeFile.previewDataUrl || activeFile.contentUrl || activeFile.previewUrl || '';
    return <div className="flex h-full w-full items-center justify-center overflow-auto bg-[#0b0c0f] p-6"><div className="flex max-h-full max-w-full flex-col items-center gap-3">{src ? <div className="flex max-h-[calc(100vh-170px)] max-w-[90vw] items-center justify-center overflow-auto rounded-xl border border-white/[.08] bg-[#111216] p-5 shadow-2xl"><img src={src} alt={activeFile.name} className="max-h-[calc(100vh-220px)] max-w-full object-contain" draggable="false" /></div> : <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-8 py-10 text-center text-sm text-white/30">Image preview unavailable</div>}<p className="text-xs text-white/40">{activeFile.name}</p></div></div>;
  }
  return <div className="h-full w-full overflow-hidden"><Editor height="100%" width="100%" language={language} value={content} theme="vs-dark" onChange={(value) => onChange?.(value ?? '')} options={{ readOnly, automaticLayout: true, fontSize: 14, lineHeight: 22, fontFamily: "'JetBrains Mono','Cascadia Code',Consolas,monospace", fontLigatures: true, cursorBlinking: 'smooth', smoothScrolling: true, scrollBeyondLastLine: false, wordWrap: 'off', minimap: { enabled: true }, folding: true, bracketPairColorization: { enabled: true }, guides: { indentation: true, bracketPairs: true }, lineNumbers: 'on', renderWhitespace: 'selection', padding: { top: 16, bottom: 16 }, quickSuggestions: true, suggestOnTriggerCharacters: true, contextmenu: true, overviewRulerBorder: false, scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 } }} /></div>;
}
