import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function usePriceTrends(productIdInitial) {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchTrends(prodId = productIdInitial) {
    if (!prodId) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from('v_product_price_trend')
      .select('mois, prix_moyen')
      .eq('mama_id', mama_id)
      .eq('product_id', prodId)
      .order('mois');
    setLoading(false);
    if (error) return [];
    setData(data || []);
    return data || [];
  }

  return { data, loading, fetchTrends };
}
