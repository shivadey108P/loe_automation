import { useEffect } from 'react'
import { useStreamingText } from '../lib/useStreamingText'

export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string }

export function ChatBubble({
  message,
  streaming,
  onStreamDone,
}: {
  message: ChatMessage
  streaming: boolean
  onStreamDone: () => void
}) {
  const shown = useStreamingText(message.text, streaming)

  useEffect(() => {
    if (streaming && shown === message.text) onStreamDone()
  }, [streaming, shown, message.text, onStreamDone])

  const isUser = message.role === 'user'
  const displayText = streaming ? shown : message.text

  return (
    <div className={`flex animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-violet-600 text-white'
            : 'border border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}
      >
        {displayText}
        {streaming && shown.length < message.text.length && (
          <span className="ml-0.5 inline-block h-3.5 w-0.5 align-middle bg-current animate-blink" />
        )}
      </div>
    </div>
  )
}
