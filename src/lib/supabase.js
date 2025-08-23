import { createClient } from '@supabase/supabase-js'

const url =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL

const anonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY

const isTest = process.env.NODE_ENV === 'test'

if (!url || !anonKey) {
  if (!isTest) throw new Error('Missing Supabase credentials')
}

const client = createClient(url ?? 'https://example.supabase.co', anonKey ?? 'key')

export default client
export const supabase = client

