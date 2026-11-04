import { useRef, useState } from 'react'

type VoiceState = 'idle' | 'recording' | 'transcribing'

// Stand-in for a Whisper transcription + LLM clean-up pass ("...um, so..." -> tidy sentence).
// Replace the timeout below with a real POST to /capture-audio once that endpoint exists.
const MOCK_TRANSCRIPT =
  "So I was thinking we could do a short video about how prompt caching actually works, and why it cuts LLM costs so much."

export function useVoiceCapture(onTranscribed: (cleanedText: string) => void) {
  const [state, setState] = useState<VoiceState>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function start() {
    setState('recording')
  }

  function stop() {
    setState('transcribing')
    timeoutRef.current = setTimeout(() => {
      onTranscribed(MOCK_TRANSCRIPT)
      setState('idle')
    }, 1400)
  }

  function cancel() {
    clearTimeout(timeoutRef.current)
    setState('idle')
  }

  return { state, start, stop, cancel }
}
