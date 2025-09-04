// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

export function usePriceTrends(productIdInitial) {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchTrends(prodId = productIdInitial) {
    if (!prodId) return [];
    setLoading(true);
    // Vue renommée v_tendance_prix_produit dans le schéma final
    const { data, error } = await supabase.
    from('v_tendance_prix_produit').
    select('mois, prix_moyen').
    eq('mama_id', mama_id).
    eq('produit_id', prodId).
    order('mois');
    setLoading(false);
    if (error) return [];
    setData(data || []);
    return data || [];
  }

  return { data, loading, fetchTrends };
}