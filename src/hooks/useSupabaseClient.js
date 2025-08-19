// Retourne le client Supabase initialisé
import supabase from '@/lib/supabaseClient';

export default function useSupabaseClient() {
  return supabase;
}

// Alias export to match new hook naming
export function useSupabase() {
  return supabase;
}
