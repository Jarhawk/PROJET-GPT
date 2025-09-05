// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { applyIlikeOr } from '@/lib/supa/textSearch';

export function useProduitsInventaire() {
  const { mama_id } = useAuth();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduits = useCallback(
    async ({ famille = '', search = '' } = {}) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase.
      from('v_produits_dernier_prix').
      select('id, nom, unite_id, unite:unites!fk_produits_unite(nom), famille').
      eq('mama_id', mama_id).
      eq('actif', true);
      if (famille) query = query.ilike('famille', `%${famille}%`);
      query = applyIlikeOr(query, search);
      const { data, error } = await query.order('nom', { ascending: true });
      setLoading(false);
      if (error) {
        setError(error);
        return [];
      }
      const { data: pmpData } = await supabase.
      from('v_pmp').
      select('produit_id, pmp').
      eq('mama_id', mama_id);
      const { data: stockData } = await supabase.
      from('v_stocks').
      select('produit_id, stock').
      eq('mama_id', mama_id);
      const pmpMap = Object.fromEntries((pmpData || []).map((p) => [p.produit_id, p.pmp]));
      const stockMap = Object.fromEntries((stockData || []).map((s) => [s.produit_id, s.stock]));
      const final = (Array.isArray(data) ? data : []).map((p) => ({
        ...p,
        unite: p.unite?.nom || '',
        pmp: pmpMap[p.id] ?? 0,
        stock_theorique: stockMap[p.id] ?? 0
      }));
      setProduits(final);
      return final;
    },
    [mama_id]
  );

  return { produits, loading, error, fetchProduits };
}