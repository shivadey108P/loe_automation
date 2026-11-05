import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// These are baked into the bundle at build time. If one is missing the build would still
// succeed and ship a broken app, so fail the production build instead (old deploy stays live).
const REQUIRED_ENV = ['VITE_API_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const missing = REQUIRED_ENV.filter((k) => !env[k])
    if (missing.length) {
      throw new Error(`Missing build variables: ${missing.join(', ')}. Set them in the build environment.`)
    }
  }
  return { plugins: [react(), tailwindcss(), cloudflare()] }
})
