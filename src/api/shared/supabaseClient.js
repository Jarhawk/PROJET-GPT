// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { createSupabaseClient } from '@/lib/supabase.js'

let client = null
let lastUrl = null
let lastKey = null

export function getSupabaseClient(url, key) {
  const envUrl = url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const envKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!envUrl || !envKey) throw new Error('Missing Supabase credentials')
  if (!client || envUrl !== lastUrl || envKey !== lastKey) {
    client = createSupabaseClient(envUrl, envKey)
    lastUrl = envUrl
    lastKey = envKey
  }
  return client
}
