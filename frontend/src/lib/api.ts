import { supabase } from './supabase'

const BASE = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '')

export type Status = 'captured' | 'refined' | 'used' | 'archived'

export type Idea = {
  id: string
  title: string | null
  category: string | null
  tags: string[] | null
  raw_text: string
  structured_text: string | null
  summary: string | null
  status: Status
  created_at: string
}

export type Proposal = Partial<Pick<Idea, 'title' | 'category' | 'tags' | 'structured_text' | 'summary'>>

export type IdeaMessage = {
  id: string
  idea_id: string
  role: 'user' | 'assistant' | 'system'
  content: string | null
  proposal: Proposal | null
  created_at: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.status === 401 || res.status === 403) await supabase.auth.signOut()
  if (!res.ok) {
    const detail = await res.json().then((j) => j.detail).catch(() => res.statusText)
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const api = {
  listIdeas: (q?: string, limit = 50) =>
    request<Idea[]>(`/ideas?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  getIdea: (id: string) => request<Idea>(`/ideas/${id}`),
  getMessages: (id: string) => request<IdeaMessage[]>(`/ideas/${id}/messages`),
  captureText: (raw_text: string) => request<Idea>('/capture-text', post({ raw_text })),
  captureAudio: (file: Blob, filename: string) => {
    const form = new FormData()
    form.append('file', file, filename)
    return request<Idea>('/capture-audio', { method: 'POST', body: form })
  },
  refine: (id: string, message: string) =>
    request<IdeaMessage>(`/ideas/${id}/refine`, post({ message })),
  apply: (id: string) => request<Idea[] | Idea>(`/ideas/${id}/apply`, { method: 'POST' }),
}
