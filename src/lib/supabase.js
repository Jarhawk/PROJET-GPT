import { createClient } from '@supabase/supabase-js'

let singleton
let initError = null
let cachedEnv

export function getSupabaseEnv() {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL
  const anonKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  return { url, anonKey }
}

export function getSupabaseClient() {
  if (globalThis.__SUPABASE_TEST_CLIENT__) {
    singleton = globalThis.__SUPABASE_TEST_CLIENT__
    cachedEnv = null
    return singleton
  }
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) {
    initError =
      'Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    singleton = null
    cachedEnv = null
    if (process.env.NODE_ENV === 'production') {
      throw new Error(initError)
    }
    return null
  }
  if (singleton && cachedEnv?.url === url && cachedEnv?.anonKey === anonKey) {
    return singleton
  }
  singleton = createClient(url, anonKey)
  cachedEnv = { url, anonKey }
  return singleton
}

export const supabase = getSupabaseClient()
export { initError as supabaseInitError }
