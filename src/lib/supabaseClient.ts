import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const globalForSupabase = globalThis as any

export const supabase =
  globalForSupabase.supabase ||
  createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, storageKey: 'mamastock-auth' },
  })

if (!globalForSupabase.supabase) {
  globalForSupabase.supabase = supabase
}

export default supabase
