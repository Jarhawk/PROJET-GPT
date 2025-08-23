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

let client

function initClient() {
  if (client) return client
  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing Supabase credentials')
    }
    client = makeNoopClient()
  } else {
    client = createClient(url, anonKey)
  }
  return client
}

export function getSupabaseClient() {
  return initClient()
}

// Proxy to lazily init client while preserving direct `supabase` import usage
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const c = initClient()
      return c[prop]
    },
  }
)

