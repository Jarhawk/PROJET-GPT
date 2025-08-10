// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useTopProducts() {
  const { mama_id } = useAuth();

  async function fetchTop({ debut = null, fin = null, limit = 5 } = {}) {
    const { data, error } = await supabase.rpc('top_produits', {
      mama_id_param: mama_id,
      debut_param: debut,
      fin_param: fin,
      limit_param: limit,
    });
    if (error) return [];
    return data || [];
  }

  return { fetchTop };
}
