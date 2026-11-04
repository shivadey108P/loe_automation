import { Calendar, Check, Copy, Loader2, Mic, Send, Sparkles } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChatBubble, type ChatMessage } from '../components/ChatBubble'
import { useVoiceCapture } from '../lib/useVoiceCapture'

type Status = 'captured' | 'refined' | 'used' | 'archived'
type Platform = 'TikTok' | 'Instagram Reels' | 'YouTube Shorts' | 'LinkedIn' | 'X / Twitter' | 'Blog'

const SUGGESTED_PROMPTS = ['Mark as used', 'Push the deadline by a week', 'Switch to TikTok']

const PLATFORMS: Platform[] = [
  'TikTok',
  'Instagram Reels',
  'YouTube Shorts',
  'LinkedIn',
  'X / Twitter',
  'Blog',
]

type IdeaFields = {
  title: string
  content: string
  platform: Platform
  status: Status
  deadline: string
  tags: string[]
}

// Stub — replaced with a real GET /ideas/:id fetch once this screen is wired to the backend.
const STUB_IDEA: IdeaFields = {
  title: 'Short-form clip on prompt caching',
  content:
    'A 60-second walkthrough of how prompt caching works and why it cuts LLM costs. Hook: "You\'re probably paying 10x more than you need to."',
  platform: 'YouTube Shorts',
  status: 'refined',
  deadline: '',
  tags: ['llm', 'cost-saving', 'short-form'],
}

export function IdeaDetail() {
  const { id } = useParams()
  const [fields, setFields] = useState<IdeaFields>(STUB_IDEA)
  const [flashField, setFlashField] = useState<keyof IdeaFields | null>(null)

  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const voice = useVoiceCapture((transcript) =>
    setChatInput((t) => (t ? `${t} ${transcript}` : transcript)),
  )

  function updateField<K extends keyof IdeaFields>(key: K, value: IdeaFields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  function flash(key: keyof IdeaFields) {
    setFlashField(key)
    setTimeout(() => setFlashField((current) => (current === key ? null : current)), 900)
  }

  async function handleCopyJson() {
    const payload = { id, ...fields }
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // Mock "LLM instructed field update" — matches a few keywords and edits a field directly,
  // so manual edits above still work as the fallback. Swap for a real /ideas/:id/refine call later.
  function mockApplyInstruction(instruction: string): string {
    const lower = instruction.toLowerCase()
    const applied: string[] = []

    if (lower.includes('used')) {
      updateField('status', 'used')
      flash('status')
      applied.push('marked this as used')
    } else if (lower.includes('refine') || lower.includes('draft')) {
      updateField('status', 'refined')
      flash('status')
      applied.push('marked this as refined')
    }

    const platformHit = PLATFORMS.find((p) => lower.includes(p.toLowerCase().split(' ')[0]))
    if (platformHit) {
      updateField('platform', platformHit)
      flash('platform')
      applied.push(`switched the platform to ${platformHit}`)
    }

    if (lower.includes('deadline') || lower.includes('friday') || lower.includes('tomorrow') || lower.includes('week')) {
      const d = new Date()
      d.setDate(d.getDate() + 3)
      updateField('deadline', d.toISOString().slice(0, 10))
      flash('deadline')
      applied.push(`set the deadline to ${d.toLocaleDateString()}`)
    }

    if (applied.length === 0) {
      return "Noted — once this is wired to the real refine endpoint I'll update the fields directly from instructions like this. For now you can edit them by hand above."
    }
    const summary = applied.length === 1 ? applied[0] : `${applied.slice(0, -1).join(', ')} and ${applied.at(-1)}`
    return `Done — I ${summary}. Adjust anything manually above if that's not quite right.`
  }

  function handleSend() {
    if (!chatInput.trim()) return
    const replyText = mockApplyInstruction(chatInput)
    const ackId = crypto.randomUUID()
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'user', text: chatInput.trim() },
      { id: ackId, role: 'assistant', text: replyText },
    ])
    setStreamingId(ackId)
    setChatInput('')
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Idea #{id}</p>
        <button
          type="button"
          onClick={handleCopyJson}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            copied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy as JSON'}
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <input
          value={fields.title}
          onChange={(e) => updateField('title', e.target.value)}
          className={`-mx-1 w-full rounded-md bg-transparent px-1 py-0.5 text-lg font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-100 dark:hover:bg-gray-800/60 dark:focus:bg-gray-800/60 ${
            flashField === 'title' ? 'animate-field-flash' : ''
          }`}
        />
        <textarea
          value={fields.content}
          onChange={(e) => updateField('content', e.target.value)}
          rows={4}
          className={`max-h-40 w-full resize-none overflow-y-auto rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ${
            flashField === 'content' ? 'animate-field-flash' : ''
          }`}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FieldLabel label="Platform">
            <select
              value={fields.platform}
              onChange={(e) => updateField('platform', e.target.value as Platform)}
              className={`w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${
                flashField === 'platform' ? 'animate-field-flash' : ''
              }`}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Status">
            <select
              value={fields.status}
              onChange={(e) => updateField('status', e.target.value as Status)}
              className={`w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${
                flashField === 'status' ? 'animate-field-flash' : ''
              }`}
            >
              <option value="captured">captured</option>
              <option value="refined">refined</option>
              <option value="used">used</option>
              <option value="archived">archived</option>
            </select>
          </FieldLabel>

          <FieldLabel label="Deadline">
            <div
              className={`flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800 ${
                flashField === 'deadline' ? 'animate-field-flash' : ''
              }`}
            >
              <Calendar size={12} className="shrink-0 text-gray-400" />
              <input
                type="date"
                value={fields.deadline}
                onChange={(e) => updateField('deadline', e.target.value)}
                className="w-full bg-transparent text-xs text-gray-700 focus:outline-none dark:text-gray-200"
              />
            </div>
          </FieldLabel>

        </div>

        <FieldLabel label="Tags">
          <input
            value={fields.tags.join(', ')}
            onChange={(e) =>
              updateField(
                'tags',
                e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
              )
            }
            placeholder="comma, separated"
            className={`w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${
              flashField === 'tags' ? 'animate-field-flash' : ''
            }`}
          />
        </FieldLabel>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Refine with AI</p>
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-gray-400">
            <Sparkles size={16} />
            Ask the assistant to refine this idea, or edit the fields above directly.
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setChatInput(prompt)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-700 dark:hover:text-violet-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              streaming={m.id === streamingId}
              onStreamDone={() => setStreamingId(null)}
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 pl-4 dark:border-gray-800 dark:bg-gray-900">
        {voice.state === 'transcribing' ? (
          <span className="flex flex-1 items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
            <Loader2 size={14} className="animate-spin" />
            Transcribing...
          </span>
        ) : (
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            type="text"
            placeholder={voice.state === 'recording' ? 'Listening...' : 'Ask the assistant to refine this idea...'}
            disabled={voice.state === 'recording'}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
          />
        )}
        <button
          type="button"
          onClick={voice.state === 'recording' ? voice.stop : voice.start}
          disabled={voice.state === 'transcribing'}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 ${
            voice.state === 'recording'
              ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          <Mic size={14} />
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!chatInput.trim() || voice.state !== 'idle'}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:size-9"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">{label}</span>
      {children}
    </label>
  )
}
