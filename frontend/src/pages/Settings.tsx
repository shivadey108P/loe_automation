import { LogOut, Moon, Sun } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/useTheme'

export function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-100">Settings</h1>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme & appearance</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Switch between dark and light mode.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Account</p>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
