// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

let singleton

function getBrowserEnv(key) {
  try {
    return import.meta.env?.[key]
  } catch {
    return undefined
  }
}

function getNodeEnv(key) {
  return typeof process !== 'undefined' && process?.env ? process.env[key] : undefined
}

function resolveCredentials() {
  const isNode = typeof process !== 'undefined' && process?.versions?.node
  const url = isNode
    ? getNodeEnv('SUPABASE_URL') ||
      getNodeEnv('VITE_SUPABASE_URL') ||
      getBrowserEnv('VITE_SUPABASE_URL')
    : getBrowserEnv('VITE_SUPABASE_URL')
  const anonKey = isNode
    ? getNodeEnv('SUPABASE_ANON_KEY') ||
      getNodeEnv('VITE_SUPABASE_ANON_KEY') ||
      getBrowserEnv('VITE_SUPABASE_ANON_KEY')
    : getBrowserEnv('VITE_SUPABASE_ANON_KEY')
  return { url, anonKey }
}

export function getSupabaseClient() {
  if (globalThis.__SUPABASE_TEST_CLIENT__) return globalThis.__SUPABASE_TEST_CLIENT__
  if (!singleton) {
    const { url, anonKey } = resolveCredentials()
    if (!url || !anonKey) {
      throw new Error('Missing Supabase credentials. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    }
    singleton = createClient(url, anonKey)
  }
  return singleton
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseClient()[prop]
    },
  },
)


