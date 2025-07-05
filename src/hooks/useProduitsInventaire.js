// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useProduitsInventaire() {
  const { mama_id } = useAuth();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduits = useCallback(
    async ({ zone = '', famille = '', search = '' } = {}) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase
        .from('v_produits_dernier_prix')
        .select('id, nom, unite, pmp, famille, zone_stockage, stock_theorique')
        .eq('mama_id', mama_id)
        .eq('actif', true);
      if (zone) query = query.eq('zone_stockage', zone);
      if (famille) query = query.ilike('famille', `%${famille}%`);
      if (search) query = query.ilike('nom', `%${search}%`);
      const { data, error } = await query.order('nom', { ascending: true });
      setLoading(false);
      if (error) {
        setError(error);
        return [];
      }
      setProduits(Array.isArray(data) ? data : []);
      return data || [];
    },
    [mama_id]
  );

  return { produits, loading, error, fetchProduits };
}
