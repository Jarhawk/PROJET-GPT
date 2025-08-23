// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Helper: lit d'abord Vite (browser), puis Node (tests/scripts)
function getEnv(key) {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
      return import.meta.env[key]
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process?.env && key in process.env) {
      return process.env[key]
    }
  } catch {}
  return undefined
}

// Vars possibles (préfixe Vite puis génériques Node)
const url =
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('SUPABASE_URL')

const anonKey =
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('SUPABASE_ANON_KEY')

// Client no-op pour éviter les erreurs en dev/test sans creds
function makeNoopClient() {
  const result = { data: [], error: null, count: 0 }

  const thenable = {
    then: (resolve) => resolve(result),
    catch: () => thenable,
    finally: () => thenable,
  }

  const chain = new Proxy(function () {}, {
    get: (_, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return thenable[prop]
      return chain
    },
    apply: () => chain,
  })

  console.warn('[supabase] Missing credentials — using noop client (dev/test). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return {
    from: () => chain,
    rpc: () => chain,
    storage: { from: () => chain },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  }
}

export const supabase = (url && anonKey)
  ? createClient(url, anonKey)
  : makeNoopClient()

