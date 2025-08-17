// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

function normalize(list = []) {
  return list.map((p) => ({
    id: p.id ?? p.produit_id,
    nom: p.nom,
    unite_achat: p.unite_achat || p.unite,
    zone_id: p.zone_id ?? p.zone_stock_id,
    pmp: p.pmp ?? p.pmp_ht,
    prix_unitaire: p.prix_unitaire ?? p.price_ht ?? p.dernier_prix ?? 0,
  }));
}

export function useProductSearch(query, { enabled = true } = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;

  return useQuery({
    queryKey: ['product-search', mamaId, query],
    enabled: enabled && Boolean(mamaId) && (query || '').trim().length >= 2,
    staleTime: 0,
    gcTime: 0,
    keepPreviousData: false,
    queryFn: async ({ signal }) => {
      const q = (query || '').trim();
      if (!q || !mamaId) return [];

      try {
        let rq = supabase
          .from('produits')
          .select(
            'id, nom, unite_achat, unite, zone_id, zone_stock_id, pmp, pmp_ht, prix_unitaire, price_ht, dernier_prix'
          )
          .eq('mama_id', mamaId)
          .limit(50)
          .ilike('nom', `%${q}%`)
          .order('nom', { ascending: true });
        try { rq = rq.eq('actif', true); } catch {}
        const { data, error } = await rq;
        if (!error && !signal.aborted) return normalize(data);
      } catch (e) {
        if (e.name === 'AbortError') throw e;
      }

      try {
        let rq2 = supabase
          .from('v_produits_actifs')
          .select(
            'id, produit_id, nom, unite_achat, unite, zone_id, zone_stock_id, pmp, pmp_ht, prix_unitaire, price_ht, dernier_prix'
          )
          .eq('mama_id', mamaId)
          .limit(50)
          .ilike('nom', `%${q}%`)
          .order('nom', { ascending: true });
        const { data: data2, error: error2 } = await rq2;
        if (!error2 && !signal.aborted) return normalize(data2);
      } catch (e) {
        if (e.name === 'AbortError') throw e;
      }

      return [];
    },
  });
}

export default useProductSearch;
