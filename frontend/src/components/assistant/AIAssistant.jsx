import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssistantHeader from "./AssistantHeader";
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
    if (!value || typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.rate = 1.02;
    utterance.pitch = 0.92;
    utterance.volume = 1;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
      onEnd?.();
      resolve();
    };
    utterance.onerror = () => {
      onEnd?.();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });

export default function AIAssistant({
  isOpen = true,
  onClose,
  onMinimize,
  onMaximize,
  onOpenFile,
  onRunTool,
  initialMessages = [],
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceWaiting, setVoiceWaiting] = useState(false);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [tool, setTool] = useState(null);

  const turnBusyRef = useRef(false);
  const mountedRef = useRef(true);
  const speechRunRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      speechRunRef.current += 1;
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    speechRunRef.current += 1;
    window.speechSynthesis?.cancel?.();
    if (mountedRef.current) setSpeaking(false);
  }, []);

  const speak = useCallback(async (text) => {
    const run = ++speechRunRef.current;
    if (!text?.trim()) return;

    await waitForSpeech(
      text,
      () => {
        if (mountedRef.current && speechRunRef.current === run) setSpeaking(true);
      },
      () => {
        if (mountedRef.current && speechRunRef.current === run) setSpeaking(false);
      }
    );
  }, []);

  const submit = useCallback(async (value = draft, meta = {}) => {
    const text = String(value || "").trim();
    if (!text || turnBusyRef.current) return false;

    turnBusyRef.current = true;
    setThinking(true);
    setVoiceWaiting(true);
    setDraft("");

    const userMessage = {
      id: makeId("user"),
      role: "user",
      content: text,
      source: meta.voice ? "voice" : "text",
      time: new Date(),
    };

    setMessages((items) => [...items, userMessage]);

    try {
      if (onRunTool) {
        const history = [...messages, userMessage]
          .slice(-12)
          .map((item) => ({ role: item.role, content: String(item.content || "") }));

        const result = await onRunTool({ type: "assistant_message", text, history });

        if (!mountedRef.current) return true;
        if (result?.tool) setPendingCommand(result.tool);

        if (result?.message) {
          const assistantMessage = {
            id: makeId("assistant"),
            role: "assistant",
            content: result.message,
            time: new Date(),
          };

          setMessages((items) => [...items, assistantMessage]);

          if (meta.voice || voiceMode) await speak(result.message);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 650));
        if (!mountedRef.current) return true;

        const message = "Connect the assistant API to enable Gemini responses and DEVSPA tools.";

        setMessages((items) => [
          ...items,
          { id: makeId("assistant"), role: "assistant", content: message, time: new Date() },
        ]);

        if (meta.voice || voiceMode) await speak(message);
      }
    } catch (error) {
      if (!mountedRef.current) return true;

      const message = error?.message || "I couldn't complete that request.";

      setMessages((items) => [
        ...items,
        { id: makeId("assistant-error"), role: "assistant", content: message, time: new Date() },
      ]);

      if (meta.voice || voiceMode) await speak(message);
    } finally {
      if (mountedRef.current) {
        setThinking(false);
        setVoiceWaiting(false);
      }
      turnBusyRef.current = false;
    }

    return true;
  }, [draft, messages, onRunTool, speak, voiceMode]);

  const handleVoiceResult = useCallback((text) => {
    const value = String(text || "").trim();
    if (!value || turnBusyRef.current) return;
    submit(value, { voice: true });
  }, [submit]);

  const toggleVoiceMode = useCallback(() => {
    if (turnBusyRef.current) return;
    setVoiceMode((value) => !value);
  }, []);

  const acceptCommand = async () => {
    if (!pendingCommand || turnBusyRef.current) return;

    setTool({ ...pendingCommand, state: "running" });
    setPendingCommand(null);

    try {
      const result = await onRunTool?.(pendingCommand);
      setTool({ ...pendingCommand, state: "success", result });
    } catch (error) {
      setTool({
        ...pendingCommand,
        state: "error",
        result: { message: error?.message || "Tool execution failed." },
      });
    }
  };

  useEffect(() => {
    if (!tool || (tool.state !== "success" && tool.state !== "error")) return;

    const timer = window.setTimeout(() => setTool(null), 5000);
    return () => window.clearTimeout(timer);
  }, [tool]);

  const status = useMemo(
    () =>
      speaking
        ? "Speaking"
        : thinking
          ? "Thinking"
          : listening
            ? "Listening"
            : voiceMode
              ? "Voice mode"
              : "Online",
    [thinking, listening, speaking, voiceMode]
  );

  if (!isOpen) return null;

  return (
    <section className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#05080d] text-white selection:bg-cyan-300/20">
      {/* JARVIS-style HUD atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/[0.035] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/[0.035] blur-3xl" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(103,232,249,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.025)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent" />
      </div>

      <AssistantHeader
        status={status}
        voiceMode={voiceMode}
        speaking={speaking}
        onToggleVoiceMode={toggleVoiceMode}
        onStopSpeaking={stopSpeaking}
        // Window controls are owned by the outer AI Assistant shell.
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
      />

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        <AssistantChat
          messages={messages}
          thinking={thinking}
          suggestions={suggestions}
          onSuggestion={(prompt) => submit(prompt)}
          onOpenFile={onOpenFile}
          onStopSpeaking={stopSpeaking}
          speaking={speaking}
        />

        {!messages.length && (
          <div className="pointer-events-none absolute left-1/2 top-[31%] hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <VoiceVisualizer active={listening || speaking} />
          </div>
        )}

        {pendingCommand && (
          <div className="absolute inset-x-4 bottom-4 z-20">
            <CommandPreview
              command={pendingCommand}
              onCancel={() => setPendingCommand(null)}
              onConfirm={acceptCommand}
            />
          </div>
        )}

        {tool && (
          <div className="absolute bottom-4 right-4 z-30 w-[min(360px,calc(100%-2rem))]">
            <ToolExecution tool={tool} />
          </div>
        )}
      </div>

      <div className="relative z-10 shrink-0 border-t border-cyan-300/[0.07] bg-[#06090e]/95 p-3 backdrop-blur-xl">
        <AssistantInput
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          listening={listening}
          setListening={setListening}
          onVoiceResult={handleVoiceResult}
          disabled={thinking}
          voiceMode={voiceMode}
          autoStartVoice={voiceMode && !thinking && !voiceWaiting && !speaking}
          onToggleVoiceMode={toggleVoiceMode}
        />

        <p className="mt-2 text-center text-[7px] uppercase tracking-[0.2em] text-white/15">
          {voiceMode
            ? "VOICE CHANNEL · ONE TURN AT A TIME · RESPONSE FIRST"
            : "DEVSPA AI · WORKSPACE INTELLIGENCE · TOOL ACCESS CONTROLLED"}
        </p>
      </div>
    </section>
  );
}