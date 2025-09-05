import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  console.error(
    'Missing Supabase env. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
  );
  // Option: afficher une bannière Dev
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true },
});

export default supabase;
