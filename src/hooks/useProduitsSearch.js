// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import useDebounce from '@/hooks/useDebounce';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

function normalize(list = []) {
  return list.map((p) => ({
    id: p.id ?? p.produit_id ?? null,
    nom: p.nom ?? null,
    // unite_id est nécessaire pour hydrater l'unité dans les formulaires
    unite_id: p.unite_id ?? null,
    tva: p.tva ?? null,
    zone_stock_id: p.zone_stock_id ?? null,
  }));
}

export function useProduitsSearch(
  term = '',
  mamaIdParam,
  { enabled = true, debounce = 300, page = 1, pageSize = 20 } = {}
) {
  const { mama_id: authMamaId } = useAuth();
  const mamaId = mamaIdParam || authMamaId;
  const debounced = useDebounce(term, debounce);

  const query = useQuery({
    queryKey: ['produits-search', mamaId, debounced, page, pageSize],
    enabled: enabled && debounced.trim().length >= 2 && !!mamaId,
    queryFn: async () => {
      const q = debounced.trim();
      if (q.length < 2) return { rows: [], total: 0 };
      console.debug('[useProduitsSearch] search produits', { q, mamaId, page });
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      try {
        const { data, count, error } = await supabase
          .from('produits')
          .select('id, nom, unite_id, tva, zone_stock_id', { count: 'exact' })
          .eq('mama_id', mamaId)
          .eq('actif', true)
          .ilike('nom', `%${q}%`)
          .order('nom', { ascending: true })
          .range(from, to);
        if (error) throw error;
        return { rows: normalize(data), total: count || 0 };
      } catch (err) {
        console.warn('[useProduitsSearch] produits query failed', err);
        return { rows: [], total: 0 };
      }
    },
  });

  return {
    data: query.data?.rows || [],
    total: query.data?.total || 0,
    page,
    pageSize,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export default useProduitsSearch;
