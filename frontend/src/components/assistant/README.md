# DEVSPA Assistant — One Turn at a Time Voice Fix

## Problem fixed
Rapid Web Speech Recognition callbacks could arrive before React updated `thinking=true`. Multiple voice transcripts were therefore submitted concurrently. The UI showed many repeated user messages and the backend returned several answers together.

## New behavior
1. User speaks one question.
2. Recognition ends.
3. A synchronous turn lock accepts exactly one transcript.
4. DEVSPA sends exactly one API request.
5. The assistant message is added.
6. In Voice Mode, DEVSPA speaks the answer.
7. Only after the answer finishes does the microphone listen for the next question.
8. Stop Speaking cancels browser speech immediately.
9. Recent chat history is sent with each assistant request.

## Replace these files
- AIAssistant.jsx
- AssistantInput.jsx
- VoiceButton.jsx
- AssistantHeader.jsx
- AssistantChat.jsx

The remaining files are included for a complete assistant-folder replacement.
