import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssistantHeader from "./AssistantHeader";
import AssistantSidebar from "./AssistantSidebar";
import AssistantChat from "./AssistantChat";
import AssistantInput from "./AssistantInput";
import CommandPreview from "./CommandPreview";
import ToolExecution from "./ToolExecution";
import VoiceVisualizer from "./VoiceVisualizer";

const suggestions = [
  { label: "Analyze this project", prompt: "Analyze my current project and tell me the most important issue." },
  { label: "Explain current file", prompt: "Explain the currently open file in simple terms." },
  { label: "Find a file", prompt: "Find the file responsible for authentication." },
  { label: "Debug this", prompt: "Analyze the current error and suggest a safe fix." },
];

const makeId = (suffix = "item") =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${suffix}`;

const waitForSpeech = (text, onStart, onEnd) =>
  new Promise((resolve) => {
    const value = String(text || "").trim();
    if (!value || typeof window === "undefined" || !window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.rate = 1.02;
    utterance.pitch = 0.92;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => { onEnd?.(); resolve(); };
    utterance.onerror = () => { onEnd?.(); resolve(); };
    window.speechSynthesis.speak(utterance);
  });

export default function AIAssistant({
  isOpen = true, onClose, onMinimize, onMaximize, onOpenFile, onRunTool, initialMessages = []
}) {
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = window.localStorage.getItem("devspa-ai-history-v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
      if (Array.isArray(initialMessages) && initialMessages.length) {
        return [{
          id: makeId("conv"),
          title: "New Chat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: initialMessages,
        }];
      }
      return [];
    } catch { return []; }
  });

  const [activeChatId, setActiveChatId] = useState(conversations[0]?.id || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const activeConversation = useMemo(() => 
    conversations.find((c) => c.id === activeChatId) || { messages: [] },
  [conversations, activeChatId]);

  const messages = activeConversation.messages;

  useEffect(() => {
    try { window.localStorage.setItem("devspa-ai-history-v2", JSON.stringify(conversations)); } 
    catch (e) { console.warn("Failed to persist chat history", e); }
  }, [conversations]);

  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [tool, setTool] = useState(null);
  const [voiceError, setVoiceError] = useState("");

  const mountedRef = useRef(true);
  const turnBusyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; window.speechSynthesis?.cancel?.(); };
  }, []);

  const handleNewChat = useCallback(() => {
    const newId = makeId("conv");
    setConversations(prev => [
      { id: newId, title: "New Chat", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] },
      ...prev
    ]);
    setActiveChatId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const updateActiveConversation = useCallback((updater) => {
    setConversations((prev) => {
      const exists = prev.find(c => c.id === activeChatId);
      if (!exists) {
        const newChat = { id: makeId("conv"), title: "New Chat", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] };
        setActiveChatId(newChat.id);
        return [updater(newChat), ...prev];
      }
      return prev.map(c => c.id === activeChatId ? updater(c) : c);
    });
  }, [activeChatId]);

  const submit = useCallback(async (value = draft, meta = {}) => {
    const text = String(value || "").trim();
    if (!text || turnBusyRef.current) return;

    turnBusyRef.current = true;
    setThinking(true);
    setDraft("");
    setVoiceError("");

    const userMessage = { id: makeId("user"), role: "user", content: text, time: new Date() };

    updateActiveConversation((chat) => ({
      ...chat,
      title: chat.messages.length === 0 ? (text.length > 25 ? text.substring(0, 25) + "..." : text) : chat.title,
      updatedAt: new Date().toISOString(),
      messages: [...chat.messages, userMessage],
    }));

    try {
      if (onRunTool) {
        const history = [...messages, userMessage].slice(-10).map(i => ({ role: i.role, content: i.content }));
        const result = await onRunTool({ type: "assistant_message", text, history });

        if (!mountedRef.current) return;
        if (result?.tool) setPendingCommand(result.tool);
        if (result?.message) {
          updateActiveConversation((chat) => ({
            ...chat, updatedAt: new Date().toISOString(),
            messages: [...chat.messages, { id: makeId("ai"), role: "assistant", content: result.message, time: new Date() }]
          }));
          if (meta.voice || voiceMode) {
            await waitForSpeech(result.message, () => setSpeaking(true), () => setSpeaking(false));
          }
        }
      }
    } catch (err) {
      updateActiveConversation((chat) => ({
        ...chat, messages: [...chat.messages, { id: makeId("err"), role: "assistant", content: err.message || "Failed to fetch response.", time: new Date() }]
      }));
    } finally {
      if (mountedRef.current) setThinking(false);
      turnBusyRef.current = false;
    }
  }, [draft, messages, onRunTool, voiceMode, updateActiveConversation]);

  const autoStartVoice = voiceMode && !thinking && !speaking && !listening;

  if (!isOpen) return null;

  return (
    <section className="relative flex h-full w-full overflow-hidden bg-[#0a0a0c] text-white font-sans selection:bg-cyan-500/30">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-64 w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.02] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/[0.02] blur-3xl" />
      </div>

      <AssistantSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        conversations={conversations}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        onNewChat={handleNewChat}
        setConversations={setConversations}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <AssistantHeader
          status={thinking ? "Thinking" : speaking ? "Speaking" : listening ? "Listening" : "Online"}
          voiceMode={voiceMode}
          onToggleVoiceMode={() => {
            setVoiceError("");
            setVoiceMode((prev) => {
              const next = !prev;
              if (!next) {
                window.speechSynthesis?.cancel?.();
                setSpeaking(false);
              }
              return next;
            });
          }}
          onClose={onClose}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="relative z-10 flex-1 overflow-hidden">
          <AssistantChat
            messages={messages}
            thinking={thinking}
            suggestions={suggestions}
            onSuggestion={(prompt) => submit(prompt)}
            onOpenFile={onOpenFile}
            speaking={speaking}
            onStopSpeaking={() => { window.speechSynthesis?.cancel?.(); setSpeaking(false); }}
          />

          {!messages.length && (
            <div className="pointer-events-none absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <VoiceVisualizer active={listening || speaking} />
            </div>
          )}

          {pendingCommand && (
            <div className="absolute inset-x-4 bottom-24 z-20 mx-auto max-w-2xl">
              <CommandPreview command={pendingCommand} onCancel={() => setPendingCommand(null)} onConfirm={() => {}} />
            </div>
          )}

          {tool && (
            <div className="absolute bottom-24 right-4 z-30 w-80">
              <ToolExecution tool={tool} />
            </div>
          )}
        </div>

        {voiceError && (
          <div className="absolute bottom-[5.5rem] left-1/2 z-30 w-[min(92%,32rem)] -translate-x-1/2 rounded-xl border border-red-400/20 bg-[#12090d]/95 px-4 py-3 text-xs text-red-200/80 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <span>{voiceError}</span>
              <button
                type="button"
                onClick={() => setVoiceError("")}
                className="shrink-0 text-red-200/40 transition hover:text-red-200"
                aria-label="Dismiss voice error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent pt-8 pb-4 px-4 sm:px-8">
          <AssistantInput
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            listening={listening}
            setListening={setListening}
            onVoiceResult={(txt) => submit(txt, { voice: true })}
            disabled={thinking}
            voiceMode={voiceMode}
            onToggleVoiceMode={() => {
              setVoiceError("");
              setVoiceMode((prev) => !prev);
            }}
            autoStart={autoStartVoice}
            onVoiceError={setVoiceError}
          />
        </div>
      </div>
    </section>
  );
}