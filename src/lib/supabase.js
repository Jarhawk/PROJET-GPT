import { createClient } from '@supabase/supabase-js';

let singleton;
export function getSupabaseClient() {
  if (singleton) return singleton;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  singleton = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return singleton;
}
export const supabase = getSupabaseClient();
