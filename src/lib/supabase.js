// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

let client

export function getSupabaseClient() {
  if (globalThis.__SUPABASE_TEST_CLIENT__) return globalThis.__SUPABASE_TEST_CLIENT__
  if (client) return client

  let url
  let anonKey

  if (typeof process !== 'undefined' && process?.env) {
    url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  }

  url = url || import.meta.env?.VITE_SUPABASE_URL
  anonKey = anonKey || import.meta.env?.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  }

  client = createClient(url, anonKey)
  return client
}

// Lazy proxy for legacy imports
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const c = getSupabaseClient()
      return c[prop]
    },
  }
)

export default supabase
