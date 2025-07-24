import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useConsoMoyenne() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [avg, setAvg] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return 0;
    setLoading(true);
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const { data, error } = await supabase
      .from('stock_mouvements')
      .select('date, quantite')
      .eq('mama_id', mama_id)
      .eq('type', 'sortie')
      .gte('date', start.toISOString())
      .order('date', { ascending: true });
    setLoading(false);
    if (error) {
      console.error(error);
      setAvg(0);
      return 0;
    }
    const daily = {};
    (data || []).forEach((m) => {
      const d = m.date?.slice(0, 10);
      if (!daily[d]) daily[d] = 0;
      daily[d] += Number(m.quantite || 0);
    });
    const values = Object.values(daily);
    const avgValue = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    setAvg(avgValue);
    console.log('Chargement dashboard terminé');
    return avgValue;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { avg, loading, refresh: fetchData };
}
