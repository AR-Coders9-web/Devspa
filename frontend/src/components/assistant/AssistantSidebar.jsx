import React, { useState, useMemo } from "react";

export default function AssistantSidebar({ 
  isOpen, setIsOpen, conversations, activeChatId, setActiveChatId, onNewChat, setConversations 
}) {
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);

  const filtered = useMemo(() => 
    conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase())),
  [conversations, search]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if(window.confirm("Delete this conversation?")) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) setActiveChatId(null);
    }
  };

  const handleClear = (id, e) => {
    e.stopPropagation();
    if(window.confirm("Clear all messages?")) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: [] } : c));
    }
  };

  return (
    <div className={`relative z-20 flex shrink-0 flex-col border-r border-white/[0.05] bg-[#050508] transition-all duration-300 ${isOpen ? "w-64" : "w-0"} overflow-hidden md:relative absolute h-full`}>
      <div className="flex h-14 items-center justify-between px-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.2em] text-white/80">WORKSPACE</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-white/40 hover:text-white">✕</button>
      </div>

      <div className="p-3">
        <button onClick={onNewChat} className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.05] py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/[0.1] transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          New Chat
        </button>
      </div>

      <div className="px-3 pb-3">
        <input type="text" placeholder="Search history..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 px-2 pb-4">
        {filtered.map(c => (
          <div key={c.id} onClick={() => setActiveChatId(c.id)} className={`group relative flex items-center justify-between px-3 py-2.5 mb-1 rounded-lg cursor-pointer transition-all ${activeChatId === c.id ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04]"}`}>
            <span className="truncate text-xs pr-6">{c.title}</span>
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id); }} className="text-white/40 hover:text-white">•••</button>
              {menuOpenId === c.id && (
                <div className="absolute right-0 top-6 z-50 w-32 rounded-lg border border-white/10 bg-[#0c1017] shadow-xl p-1">
                  <button onClick={(e) => handleClear(c.id, e)} className="w-full text-left px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 rounded">Clear messages</button>
                  <button onClick={(e) => handleDelete(c.id, e)} className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded">Delete chat</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}