// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function normalize(list = []) {
  return list.map((p) => ({
    id: p.id ?? p.produit_id ?? null,
    nom: p.nom ?? null,
    unite_id: p.unite_id ?? null,
    zone_id: p.zone_id ?? null,
    pmp: p.pmp ?? null,
    dernier_prix: p.dernier_prix ?? null,
  }));
}

export function useProduitsSearch(term = '', { enabled = true, debounce = 300 } = {}) {
  const { mama_id } = useAuth();
  const debounced = useDebounced(term, debounce);

  return useQuery({
    queryKey: ['produits-search', mama_id, debounced],
    enabled: enabled && debounced.trim().length >= 2,
    staleTime: 0,
    gcTime: 0,
    keepPreviousData: false,
    queryFn: async () => {
      const q = debounced.trim();
      if (q.length < 2) return [];

      console.debug('[useProduitsSearch] search produits', { q, mama_id });

      try {
        let rq = supabase
          .from('produits')
          .select('id, nom, unite_id, zone_id, pmp, dernier_prix')
          .limit(50)
          .ilike('nom', `%${q}%`)
          .order('nom', { ascending: true });
        if (mama_id) rq = rq.eq('mama_id', mama_id);

        const { data, error } = await rq;
        if (error) {
          console.error('[useProduitsSearch] produits error', error);
          throw error;
        }
        const results = normalize(data);
        console.debug('[useProduitsSearch] produits results', { count: results.length });
        return results;
      } catch (err) {
        console.warn(
          '[useProduitsSearch] produits query failed, fallback to v_produits_actifs',
          err
        );
      }

      try {
        let rq2 = supabase
          .from('v_produits_actifs')
          .select('id, produit_id, nom, unite_id, zone_id, pmp, dernier_prix')
          .limit(50)
          .ilike('nom', `%${q}%`)
          .order('nom', { ascending: true });
        if (mama_id) rq2 = rq2.eq('mama_id', mama_id);

        const { data: data2, error: error2 } = await rq2;
        if (error2) {
          console.error('[useProduitsSearch] v_produits_actifs error', error2);
          return [];
        }
        const results2 = normalize(data2);
        console.debug('[useProduitsSearch] v_produits_actifs results', { count: results2.length });
        return results2;
      } catch (err2) {
        console.error('[useProduitsSearch] v_produits_actifs query failed', err2);
        return [];
      }
    },
  });
}

export default useProduitsSearch;
