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
}

export function useProduitsSearch(term = '', { enabled = true } = {}) {
  const { mama_id } = useAuth();
  const debounced = useDebounced(term, 300);

  return useQuery({
    queryKey: ['produits-search', mama_id, debounced],
    enabled: enabled && debounced.trim().length >= 2,
    staleTime: 0,
    gcTime: 0,
    keepPreviousData: false,
    queryFn: async () => {
      const q = (debounced || '').trim();
      if (q.length < 2) return [];

      console.info('[useProduitsSearch] search', { q, mama_id });

      try {
        const { data, error } = await supabase.rpc('search_produits', { q });
        if (!error && Array.isArray(data)) {
          const results = normalize(data).slice(0, 50);
          console.info('[useProduitsSearch] rpc search_produits', {
            count: results.length,
          });
          if (results.length) return results;
        } else if (error) {
          console.error('[useProduitsSearch] rpc error', error);
        }
      } catch (e) {
        console.error('[useProduitsSearch] rpc exception', e);
      }

      console.info('[useProduitsSearch] fallback v_produits_actifs');
      try {
        let rq = supabase
          .from('v_produits_actifs')
          .select(
            'id, nom, code, barcode, tva, tva_rate, dernier_prix, prix_unitaire, price_ht, pmp, pmp_ht, unite_id, unite:unite_id (nom), unite_achat, zone_id, zone_stock_id'
          )
          .limit(50);

        if (mama_id) rq = rq.eq('mama_id', mama_id);
        rq = rq
          .or(`nom.ilike.%${q}%,code.ilike.%${q}%,barcode.ilike.%${q}%`)
          .order('nom', { ascending: true });

        const { data, error } = await rq;
        if (error) {
          console.error('[useProduitsSearch] fallback error', error);
          return [];
        }
        if (Array.isArray(data)) {
          const results = normalize(data);
          return results.length
            ? results
            : [{ id: '', nom: 'Aucun résultat' }];
        }
      } catch (e) {
        console.error('[useProduitsSearch] fallback exception', e);
      }
      return [];
    },
  });
}

export default useProduitsSearch;

