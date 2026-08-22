import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null (not thrown) when env vars are missing, so the rest of the app — which doesn't need
// Supabase — still boots. Only the share feature calls requireSupabase(), and only then.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in .env.local (dev) or the Vercel project env vars (prod).',
    )
  }
  return supabase
}

export const SCREENSHOTS_BUCKET = 'shared-screenshots'
