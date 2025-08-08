import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// TODO ⚠️ Veillez à vérifier que la table/fonction appelée existe bien dans full_setup_final.sql
// TODO ✅ Ajouter mama_id dans tous les appels Supabase concernés

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }
  supabase = createSupabaseClient(supabaseUrl, supabaseKey);
} catch (e) {
  console.error(e.message || e);
  supabase = null;
}

export { supabase };
export function createClient() {
  return supabase;
}
