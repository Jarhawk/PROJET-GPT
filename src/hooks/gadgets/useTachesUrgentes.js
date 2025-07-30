import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useTachesUrgentes() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const limitDate = new Date();
      limitDate.setDate(today.getDate() + 7);
      const { data, error } = await supabase
        .from('taches')
        .select('id, titre, date_echeance')
        .eq('mama_id', mama_id)
        .is('actif', true)
        .not('statut', 'eq', 'terminee')
        .gte('date_echeance', today.toISOString().slice(0, 10))
        .lte('date_echeance', limitDate.toISOString().slice(0, 10))
        .order('date_echeance', { ascending: true })
        .limit(5);
      if (error) throw error;
      setData(data || []);
      if (import.meta.env.DEV) {
        console.debug('Chargement dashboard terminé');
      }
      return data || [];
    } catch (e) {
      console.warn('useTachesUrgentes', e);
      setError(e);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
