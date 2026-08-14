export function openWithEditor(file, onOpenEditor) {
  onOpenEditor?.(file);
}

export function openWithDebugger(file, onOpenDebugger) {
  onOpenDebugger?.(file);
}

export function analyzeWithAI(file, onAnalyze) {
  onAnalyze?.(file);
}
