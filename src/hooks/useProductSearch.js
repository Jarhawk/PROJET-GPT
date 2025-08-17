// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import useDebounce from '@/hooks/useDebounce';
import supabase from '@/lib/supabaseClient';

function normalize(list = []) {
  return list.map(p => ({
    id: p.id ?? p.produit_id,
    nom: p.nom,
    unite_achat: p.unite_achat || p.unite,
    zone_id: p.zone_id ?? p.zone_stock_id,
    pmp: p.pmp ?? p.pmp_ht,
    prix_unitaire: p.prix_unitaire ?? p.price_ht ?? p.dernier_prix ?? 0,
  }));
}

function clean(str = '') {
  return str.replace(/[%_]/g, '').replace(/\s+/g, ' ').trim();
}

export function useProductSearch(term = '', { enabled = true, debounce = 300 } = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const debounced = useDebounce(term, debounce);
  const query = clean(debounced);

  return useQuery({
    queryKey: ['product-search', mamaId, query],
    enabled: enabled && Boolean(mamaId) && query.length >= 2,
    staleTime: 0,
    gcTime: 0,
    keepPreviousData: false,
    queryFn: async () => {
      if (!query || !mamaId) return [];

      try {
        let rq = supabase
          .from('produits')
          .select(
            'id, nom, unite_achat, unite, zone_id, zone_stock_id, pmp, pmp_ht, prix_unitaire, price_ht, dernier_prix'
          )
          .eq('mama_id', mamaId)
          .ilike('nom', `%${query}%`)
          .order('nom', { ascending: true })
          .limit(50);
        try {
          rq = rq.eq('actif', true);
        } catch {}
        const { data, error } = await rq;
        if (!error) return normalize(data);
      } catch (err) {
        console.debug('[useProductSearch] produits query failed', err);
      }

      try {
        let rq2 = supabase
          .from('v_produits_actifs')
          .select(
            'id, produit_id, nom, unite_achat, unite, zone_id, zone_stock_id, pmp, pmp_ht, prix_unitaire, price_ht, dernier_prix'
          )
          .eq('mama_id', mamaId)
          .ilike('nom', `%${query}%`)
          .order('nom', { ascending: true })
          .limit(50);
        const { data: data2, error: error2 } = await rq2;
        if (!error2) return normalize(data2);
      } catch (err2) {
        console.debug('[useProductSearch] v_produits_actifs query failed', err2);
      }

      return [];
    },
  });
}

export default useProductSearch;
