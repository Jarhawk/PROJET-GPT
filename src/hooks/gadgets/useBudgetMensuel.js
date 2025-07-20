import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useBudgetMensuel() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState({ cible: 0, reel: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return { cible: 0, reel: 0 };
    setLoading(true);
    const periode = new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase.rpc('fn_calc_budgets', {
      mama_id_param: mama_id,
      periode_param: periode,
    });
    setLoading(false);
    if (error) {
      console.error(error);
      setData({ cible: 0, reel: 0 });
      return { cible: 0, reel: 0 };
    }
    let cible = 0;
    let reel = 0;
    (data || []).forEach((b) => {
      cible += Number(b.budget || b.cible || 0);
      reel += Number(b.reel || b.depense || b.total || 0);
    });
    const res = { cible, reel };
    setData(res);
    return res;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, refresh: fetchData };
}
