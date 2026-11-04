import { createClient } from '@supabase/supabase-js'

// Publishable (anon) key is safe in the browser; the backend does the real gatekeeping.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  // Stay signed in: session kept in localStorage, access token refreshed automatically.
  { auth: { persistSession: true, autoRefreshToken: true } },
)
