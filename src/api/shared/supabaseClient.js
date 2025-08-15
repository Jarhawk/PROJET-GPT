// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import supabase from "@/lib/supabaseClient";

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Missing Supabase credentials');
  }
  return supabase;
}
