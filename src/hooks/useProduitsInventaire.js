// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
      let query = supabase
        .from('v_produits_dernier_prix')
        .select('id:produit_id, nom, unite, famille')
        .eq('mama_id', mama_id);
      if (famille) query = query.ilike('famille', `%${famille}%`);
      if (search) query = query.ilike('nom', `%${search}%`);
      const { data, error } = await query.order('nom', { ascending: true });
      setLoading(false);
      if (error) {
        setError(error);
        return [];
      }
      const { data: pmpData } = await supabase
        .from('v_pmp')
        .select('produit_id, pmp')
        .eq('mama_id', mama_id);
      const { data: stockData } = await supabase
        .from('v_stocks')
        .select('produit_id, stock')
        .eq('mama_id', mama_id);
      const pmpMap = {};
      const pmpArray = Array.isArray(pmpData) ? pmpData : [];
      for (const p of pmpArray) {
        pmpMap[p.produit_id] = p.pmp;
      }
      const stockMap = {};
      const stockArray = Array.isArray(stockData) ? stockData : [];
      for (const s of stockArray) {
        stockMap[s.produit_id] = s.stock;
      }
      const final = [];
      const dataArray = Array.isArray(data) ? data : [];
      for (const p of dataArray) {
        final.push({
          ...p,
          unite: p.unite || '',
          pmp: pmpMap[p.id] ?? 0,
          stock_theorique: stockMap[p.id] ?? 0,
        });
      }
      setProduits(final);
      return final;
    },
    [mama_id]
  );

  return { produits, loading, error, fetchProduits };
}
