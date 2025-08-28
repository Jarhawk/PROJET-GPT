// Déprécié : utiliser '@/lib/supabase'.
// Conserve l'ancienne API en réexportant avec validation des crédentiels.
import { getSupabaseEnv as base } from '@/lib/supabase';

export function getSupabaseEnv() {
  const { url, anonKey } = base();
  if (!url || !anonKey) throw new Error('Missing Supabase credentials');
  return { url, anonKey };
}

export default getSupabaseEnv;
