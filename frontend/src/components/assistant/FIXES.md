# DEVSPA Assistant - Fixed Build

This package preserves the existing assistant component architecture and API contract.

## Fixed
- Restored functional browser SpeechRecognition flow.
- Voice mode now automatically starts microphone recognition when the mode is enabled.
- Voice mode waits for the AI turn and speech synthesis to finish before starting the next voice turn.
- Added a one-result guard to prevent duplicate transcripts/requests.
- Added microphone permission/browser support error feedback.
- Improved microphone SVG and active/listening states.
- Stopping voice mode also stops active speech synthesis.
- Stop Audio now immediately clears the speaking UI state.
- Preserved conversation history persistence in `devspa-ai-history-v2`.
- Preserved existing workspace/context and `onRunTool` API flow.
- Preserved the existing component structure; no backend changes.

## Important
The browser must support Web Speech Recognition (Chrome/Edge generally do). Microphone permission must be allowed for the app origin.
