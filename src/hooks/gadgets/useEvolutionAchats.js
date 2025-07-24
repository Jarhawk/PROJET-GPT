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
    start.setMonth(start.getMonth() - 12);
    const { data, error } = await supabase
      .from('v_evolution_achats')
      .select('mama_id, mois, montant')
      .eq('mama_id', mama_id)
      .gte('mois', start.toISOString().slice(0, 7))
      .order('mois', { ascending: true });
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    setData(data || []);
    if (import.meta.env.DEV) console.log('Chargement dashboard terminé');
    return data || [];
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
