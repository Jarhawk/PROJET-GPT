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

export function useProduitsSearch(term = '', { enabled = true } = {}) {
  const { mama_id } = useAuth();
  const debounced = useDebounced(term, 300);

  return useQuery({
    queryKey: ['produits-search', mama_id, debounced],
    enabled: enabled && Boolean(mama_id),
    staleTime: 0,
    gcTime: 0,
    keepPreviousData: false,
    queryFn: async () => {
      if (!mama_id) return [];
      const q = (debounced || '').trim();

      // If only one character is provided, skip the search
      if (q.length === 1) return [];

      console.info('[produits] search', { q, mama_id });

      const tables = ['v_produits_actifs', 'produits'];

      for (const table of tables) {
        try {
          let rq = supabase
            .from(table)
            .select(
              'id, nom, code, barcode, tva, tva_rate, dernier_prix, prix_unitaire, price_ht, pmp, pmp_ht, unite_id, unite:unite_id (nom), zone_id, zone_stock_id'
            )
            .eq('mama_id', mama_id);
          try {
            rq = rq.eq('actif', true);
          } catch {}

          if (q.length >= 2) {
            rq = rq
              .or(`nom.ilike.%${q}%,code.ilike.%${q}%,barcode.ilike.%${q}%`)
              .order('nom', { ascending: true })
              .limit(50);
          } else {
            try {
              rq = rq.order('updated_at', { ascending: false });
            } catch {}
            rq = rq.limit(20);
          }

          const { data, error } = await rq;
          if (error || !Array.isArray(data)) continue;

          const results = data.map((p) => ({
            id: p.id,
            nom: p.nom,
            code: p.code || '',
            barcode: p.barcode || '',
            tva: p.tva ?? p.tva_rate ?? 0,
            prix_unitaire: p.prix_unitaire ?? p.price_ht ?? p.dernier_prix ?? 0,
            pmp: p.pmp ?? p.pmp_ht ?? 0,
            unite_id: p.unite_id || '',
            unite: p.unite?.nom || '',
            unite_achat: p.unite_achat || p.unite?.nom || '',
            zone_id: p.zone_id || p.zone_stock_id || '',
          }));

          if (q.length >= 2) {
            return results.length > 0
              ? results
              : [{ id: '', nom: 'Aucun résultat' }];
          }

          return results;
        } catch {}
      }

      return [];
    },
  });
}

export default useProduitsSearch;
