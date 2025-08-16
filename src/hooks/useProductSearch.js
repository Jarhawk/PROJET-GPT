// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

function normalize(list = []) {
  return list.map((p) => ({
    id: p.id,
    nom: p.nom,
    code: p.code,
    unite_achat: p.unite_achat || p.unite,
    tva: p.tva ?? p.tva_rate,
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
        const { data, error } = await supabase.rpc(
          'search_produits',
          { q },
          { signal }
        );
        if (!error && !signal.aborted) return normalize(data).slice(0, 50);
      } catch (e) {
        if (e.name === 'AbortError') throw e;
      }
      const tables = ['v_produits_actifs', 'produits'];
      for (const t of tables) {
        try {
          let rq = supabase
            .from(t)
            .select(
              'id, nom, code, unite_achat, unite, tva, tva_rate, zone_id, zone_stock_id, pmp, pmp_ht, prix_unitaire, price_ht, dernier_prix'
            )
            .eq('mama_id', mamaId)
            .limit(50);
          try { rq = rq.eq('actif', true); } catch {}
          rq = rq.or(`nom.ilike.%${q}%,code.ilike.%${q}%`);
          rq = rq.order('nom', { ascending: true });
          const { data, error } = await rq;
          if (!error && !signal.aborted) return normalize(data);
        } catch (e) {
          if (e.name === 'AbortError') throw e;
        }
      }
      return [];
    },
  });
}

export default useProductSearch;
