import { useRef, useState } from 'react'

type VoiceState = 'idle' | 'recording' | 'transcribing'

// Records mic audio; on stop, hands the blob to `onRecorded` (which uploads it to /capture-audio).
export function useVoiceCapture(onRecorded: (audio: Blob, filename: string) => Promise<void>) {
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = (e) => chunks.current.push(e.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const type = rec.mimeType || 'audio/webm'
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        setState('transcribing')
        try {
          await onRecorded(new Blob(chunks.current, { type }), `note.${ext}`)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Upload failed')
        } finally {
          setState('idle')
        }
      }
      rec.start()
      recorder.current = rec
      setState('recording')
    } catch {
      setError('Microphone unavailable')
      setState('idle')
    }
  }

  function stop() {
    recorder.current?.stop()
  }

  return { state, error, start, stop }
}
