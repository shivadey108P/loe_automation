import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Stub data — replaced with a real GET /ideas fetch once this shell is wired to the backend.
const IDEAS = [
  { id: '1', title: 'Short-form clip on prompt caching', status: 'refined', updated: '2h ago' },
  { id: '2', title: 'Carousel: 5 LangGraph gotchas', status: 'captured', updated: '1d ago' },
  { id: '3', title: 'Voice note — pricing page rewrite', status: 'captured', updated: '3d ago' },
  { id: '4', title: 'Thread: why we moved off custom calendar UI', status: 'used', updated: '1w ago' },
]

const statusStyles: Record<string, string> = {
  refined: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  captured: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  used: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-500',
}

export function Ideas() {
  const [query, setQuery] = useState('')
  const filtered = IDEAS.filter((idea) => idea.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-100">Ideas</h1>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ideas..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">No ideas match "{query}".</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((idea) => (
          <Link
            key={idea.id}
            to={`/ideas/${idea.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-violet-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-700"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {idea.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{idea.updated}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[idea.status]}`}
            >
              {idea.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
