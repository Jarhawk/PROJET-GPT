import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useAlerteStockFaible() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from('v_produits_dernier_prix')
      .select('id, nom, stock_reel, stock_min')
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    const list = (data || [])
      .filter(
        (p) =>
          typeof p.stock_min === 'number' &&
          typeof p.stock_reel === 'number' &&
          p.stock_reel < p.stock_min
      )
      .slice(0, 5);
    setData(list);
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
