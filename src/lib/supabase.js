import { createClient } from '@supabase/supabase-js'

let singleton
let initError = null

export function getSupabaseClient() {
  if (singleton) return singleton
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    initError = 'Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    return null
  }
  singleton = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  return singleton
}

export const supabase = getSupabaseClient()
export { initError as supabaseInitError }
