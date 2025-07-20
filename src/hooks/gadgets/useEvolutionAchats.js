import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useEvolutionAchats() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const start = new Date();
    start.setDate(start.getDate() - 7 * 12);
    const { data, error } = await supabase
      .from('v_evolution_achats')
      .select('semaine, montant')
      .eq('mama_id', mama_id)
      .gte('semaine', start.toISOString().slice(0, 10))
      .order('semaine', { ascending: true });
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    setData(data || []);
    return data || [];
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
