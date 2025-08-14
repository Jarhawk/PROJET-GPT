// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { supabase } from "@/lib/supabaseClient";

export function getSupabaseClient() {
  return supabase;
}
