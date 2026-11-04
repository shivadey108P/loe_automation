import { Check, Copy, Loader2, Send, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChatBubble } from '../components/ChatBubble'
import { api, type Idea, type IdeaMessage, type Proposal } from '../lib/api'

const SUGGESTED_PROMPTS = ['Make the title punchier', 'Add tags', 'Shorten the summary']

export function IdeaDetail() {
  const { id = '' } = useParams()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [messages, setMessages] = useState<IdeaMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const [i, m] = await Promise.all([api.getIdea(id), api.getMessages(id)])
      setIdea(i)
      setMessages(m)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Pending = the latest assistant message carries a proposal that differs from the saved idea.
  const lastAssistant = messages.findLast((m) => m.role === 'assistant')
  const proposal = lastAssistant?.proposal
  const pending =
    proposal &&
    Object.entries(proposal).some(([k, v]) => JSON.stringify(idea?.[k as keyof Idea]) !== JSON.stringify(v))
      ? proposal
      : null

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setBusy(true)
    setInput('')
    try {
      await api.refine(id, text)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refine failed')
    } finally {
      setBusy(false)
    }
  }

  async function applyProposal() {
    setBusy(true)
    try {
      await api.apply(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed')
    } finally {
      setBusy(false)
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(idea, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (!idea) {
    return (
      <p className="p-6 text-sm text-gray-400">{error ?? 'Loading...'}</p>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {idea.status}
        </span>
        <button
          type="button"
          onClick={copyJson}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy as JSON'}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{idea.title ?? 'Untitled'}</h1>
        {idea.category && <p className="text-xs text-gray-400">{idea.category}</p>}
        {idea.summary && <p className="text-sm text-gray-600 dark:text-gray-300">{idea.summary}</p>}
        <p className="max-h-60 overflow-y-auto text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {idea.structured_text ?? idea.raw_text}
        </p>
        {!!idea.tags?.length && (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map((t) => (
              <span key={t} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Refine with AI</p>
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-gray-400">
            <Sparkles size={16} />
            Ask the assistant to refine this idea.
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-violet-300 hover:text-violet-700 dark:border-gray-700 dark:text-gray-300"
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
              message={{ id: m.id, role: m.role === 'user' ? 'user' : 'assistant', text: m.content ?? '' }}
              streaming={false}
              onStreamDone={() => {}}
            />
          ))
        )}
        {pending && <ProposalCard proposal={pending} onApply={applyProposal} disabled={busy} />}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 pl-4 dark:border-gray-800 dark:bg-gray-900">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          type="text"
          placeholder="Ask the assistant to refine this idea..."
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || busy}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:size-9"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

function ProposalCard({ proposal, onApply, disabled }: { proposal: Proposal; onApply: () => void; disabled: boolean }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-800 dark:bg-violet-500/10">
      <p className="mb-2 text-xs font-medium tracking-wide text-violet-700 uppercase dark:text-violet-300">
        Proposed changes
      </p>
      <dl className="flex flex-col gap-1 text-gray-700 dark:text-gray-200">
        {Object.entries(proposal).map(([k, v]) => (
          <div key={k}>
            <dt className="inline text-xs font-medium text-gray-500">{k}: </dt>
            <dd className="inline">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={onApply}
        disabled={disabled}
        className="mt-3 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-40"
      >
        Apply
      </button>
    </div>
  )
}
