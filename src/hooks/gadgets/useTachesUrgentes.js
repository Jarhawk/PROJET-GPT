import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';

export default function useTachesUrgentes() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (signal) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      const today = new Date();
      const limitDate = new Date();
      limitDate.setDate(today.getDate() + 7);
      const { data: rows, error: err } = await run(
        supabase
          .from('taches')
          .select('id, titre, date_echeance')
          .eq('mama_id', mama_id)
          .is('actif', true)
          .not('statut', 'eq', 'terminee')
          .gte('date_echeance', today.toISOString().slice(0, 10))
          .lte('date_echeance', limitDate.toISOString().slice(0, 10))
          .order('date_echeance', { ascending: true })
          .limit(5)
          .abortSignal(signal)
      );
      if (err) {
        logError('useTachesUrgentes', err);
        setError(err);
        setData([]);
        setLoading(false);
        return [];
      }
      setData(rows ?? []);
      setLoading(false);
      return rows ?? [];
    },
    [mama_id]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    return fetchData(controller.signal);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
