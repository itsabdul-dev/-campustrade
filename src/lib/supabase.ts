import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase is optional at this stage: with no credentials the app runs on the
 * fixtures in src/data/mock.ts, so the UI is workable before the backend
 * exists. Every data hook checks this flag.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!, {
      auth: {
        // Implicit, not the PKCE default. PKCE stores a code verifier in the
        // localStorage of the browser that REQUESTED the link, so a magic link
        // opened anywhere else — the mail app's browser, a different default
        // browser, another profile — has no verifier and the exchange fails
        // silently. Implicit puts the tokens in the URL fragment, so the link
        // works wherever it is opened.
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

/** Narrows the client for call sites that have already checked the flag. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    )
  }
  return supabase
}
