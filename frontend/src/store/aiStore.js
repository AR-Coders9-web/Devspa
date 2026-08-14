import { useSyncExternalStore } from 'react';

const initialState = {
  messages: [],
  isAnalyzing: false,
  isListening: false,
  isSpeaking: false,
  isConnected: false,
  conversationId: null,
  currentTool: null,
  toolStatus: 'idle',
};

let state = { ...initialState };
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

export const aiStore = {
  getState: () => state,
  setState: (patch) => {
    state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
    emit();
  },
  reset: () => { state = { ...initialState }; emit(); },
  addMessage: (message) => aiStore.setState((current) => ({ messages: [...current.messages, { ...message, id: message.id || `${Date.now()}-${Math.random()}` }] })),
  setAnalyzing: (isAnalyzing) => aiStore.setState({ isAnalyzing }),
  setListening: (isListening) => aiStore.setState({ isListening }),
  setSpeaking: (isSpeaking) => aiStore.setState({ isSpeaking }),
  setConnected: (isConnected) => aiStore.setState({ isConnected }),
  setConversationId: (conversationId) => aiStore.setState({ conversationId }),
  setTool: (currentTool, toolStatus = 'running') => aiStore.setState({ currentTool, toolStatus }),
  clearTool: () => aiStore.setState({ currentTool: null, toolStatus: 'idle' }),
  subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
};

export const useAIStore = (selector = (value) => value) =>
  useSyncExternalStore(aiStore.subscribe, () => selector(aiStore.getState()), () => selector(initialState));
