import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function useTopFournisseurs(mamaId, { limit = 5 } = {}) {
  return useQuery({
    queryKey: ['top-fournisseurs', mamaId, limit],
    enabled: !!mamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_top_fournisseurs')
        .select('fournisseur_id, fournisseur, montant:montant_total, nombre_achats, mama_id')
        .eq('mama_id', mamaId)
        .order('montant_total', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    initialData: [],
  });
}
