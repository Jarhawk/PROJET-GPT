import { createClient } from '@supabase/supabase-js'

// wrapper to create a Supabase client
export function createSupabaseClient(url, key, options = {}) {
  return createClient(url, key, options)
}

// try to read environment variables (works in browser and node)
const url = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL
const key = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY

let supabase = null
if (url && key) {
  supabase = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: 'mamastock-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export { supabase }
export default supabase
