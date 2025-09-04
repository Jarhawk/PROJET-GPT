import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process?.env?.SUPABASE_URL ||
  process?.env?.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  process?.env?.SUPABASE_ANON_KEY ||
  process?.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase: SupabaseClient =
  (globalThis as any).__SUPABASE_TEST_CLIENT__ ||
  createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export default supabase;
export { supabase };
