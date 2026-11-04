import { Lightbulb, Plus, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { api, type Idea } from '../lib/api'

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-300'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
  }`

function StatusDot({ status, className = '' }: { status: string; className?: string }) {
  const color =
    status === 'refined'
      ? 'bg-emerald-500'
      : status === 'used'
        ? 'bg-gray-400'
        : status === 'archived'
          ? 'bg-gray-300 dark:bg-gray-600'
          : 'bg-amber-500'
  return <span className={`size-1.5 shrink-0 rounded-full ${color} ${className}`} aria-hidden />
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [recent, setRecent] = useState<Idea[]>([])
  const { pathname } = useLocation()

  useEffect(() => {
    api.listIdeas(undefined, 8).then(setRecent).catch(() => setRecent([]))
  }, [pathname])

  return (
    <div className="flex h-full w-full flex-col gap-4 p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Idea Vault
        </span>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
      >
        <Plus size={16} />
        New Idea
      </NavLink>

      <nav className="flex flex-col gap-1">
        <NavLink to="/ideas" className={navLinkClasses} onClick={onNavigate}>
          <Lightbulb size={16} />
          Ideas
        </NavLink>
        <NavLink to="/settings" className={navLinkClasses} onClick={onNavigate}>
          <Settings size={16} />
          Settings
        </NavLink>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <p className="px-3 text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
          Recent
        </p>
        <div className="flex flex-col gap-0.5 overflow-y-auto">
          {recent.map((idea) => (
            <NavLink
              key={idea.id}
              to={`/ideas/${idea.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`
              }
            >
              <StatusDot status={idea.status} className="mt-1.5" />
              <span className="line-clamp-2">{idea.title ?? idea.raw_text.slice(0, 60)}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
