import { Loader2, Mic, Send } from 'lucide-react'
import { useState } from 'react'
import { ChatBubble, type ChatMessage } from '../components/ChatBubble'
import { api, type Idea } from '../lib/api'
import { useVoiceCapture } from '../lib/useVoiceCapture'

const ackText = (idea: Idea) =>
  `Saved: "${idea.title ?? 'Untitled'}". Head to Ideas whenever you want to refine the details.`

export function Capture() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingId, setStreamingId] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)

  function addExchange(userText: string, assistantText: string) {
    const ackId = crypto.randomUUID()
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'user', text: userText },
      { id: ackId, role: 'assistant', text: assistantText },
    ])
    setStreamingId(ackId)
  }

  const voice = useVoiceCapture(async (audio, filename) => {
    const idea = await api.captureAudio(audio, filename)
    addExchange(idea.raw_text, ackText(idea))
  })

  async function handleCapture() {
    const raw = text.trim()
    if (!raw || busy) return
    setBusy(true)
    try {
      const idea = await api.captureText(raw)
      addExchange(raw, ackText(idea))
      setText('')
    } catch (e) {
      addExchange(raw, `Couldn't save that: ${e instanceof Error ? e.message : 'unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col p-4 sm:p-6">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-100">
            What's the idea?
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Type it out or record a voice note — you can refine it after.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-2">
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              streaming={m.id === streamingId}
              onStreamDone={() => setStreamingId(null)}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-0 mt-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {voice.state === 'transcribing' && (
          <div className="mb-2 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
            <Loader2 size={12} className="animate-spin" />
            Transcribing and saving your note...
          </div>
        )}
        {voice.error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{voice.error}</p>}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={voice.state === 'recording' ? 'Listening...' : 'A short-form video about...'}
          rows={4}
          disabled={voice.state !== 'idle'}
          className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 dark:text-gray-100"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={voice.state === 'recording' ? voice.stop : voice.start}
            disabled={voice.state === 'transcribing'}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              voice.state === 'recording'
                ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-400'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {voice.state === 'recording' ? (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                Stop
              </>
            ) : (
              <>
                <Mic size={16} />
                Record
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!text.trim() || busy || voice.state !== 'idle'}
            className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Capture
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
