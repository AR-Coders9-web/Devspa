import { useSyncExternalStore } from 'react';

const initialState = {
  status: 'ready',
  error: null,
  stackTrace: [],
  selectedFrame: null,
  codeSnippet: null,
  terminalOutput: '',
  pendingFix: null,
  history: [],
};

let state = { ...initialState };
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

export const debuggerStore = {
  getState: () => state,
  setState: (patch) => {
    state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
    emit();
  },
  reset: () => { state = { ...initialState }; emit(); },
  setError: (error) => debuggerStore.setState({ error, stackTrace: error?.stack || [], status: error ? 'error' : 'ready' }),
  setStatus: (status) => debuggerStore.setState({ status }),
  setSelectedFrame: (frame) => debuggerStore.setState({ selectedFrame: frame }),
  setTerminalOutput: (terminalOutput) => debuggerStore.setState({ terminalOutput }),
  setPendingFix: (pendingFix) => debuggerStore.setState({ pendingFix }),
  addHistory: (entry) => debuggerStore.setState((current) => ({ history: [...current.history, { ...entry, timestamp: Date.now() }] })),
  subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
};

export const useDebuggerStore = (selector = (value) => value) =>
  useSyncExternalStore(debuggerStore.subscribe, () => selector(debuggerStore.getState()), () => selector(initialState));
