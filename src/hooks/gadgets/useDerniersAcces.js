import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';

export default function useDerniersAcces() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (signal) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await run(
        supabase
          .from('logs_securite')
          .select(
            'utilisateur_id, created_at, utilisateur:utilisateurs!logs_securite_utilisateur_id_fkey(email, auth_id)'
          )
          .eq('mama_id', mama_id)
          .order('created_at', { ascending: false })
          .limit(50)
          .abortSignal(signal)
      );
      if (err) {
        logError('useDerniersAcces', err);
        setError(err);
        setData([]);
        setLoading(false);
        return [];
      }
      const seen = {};
      const list = [];
      for (const row of rows || []) {
        if (!row.utilisateur_id || seen[row.utilisateur_id]) continue;
        seen[row.utilisateur_id] = true;
        list.push({
          id: row.utilisateur_id,
          email: row.utilisateur?.email,
          date: row.created_at,
        });
        if (list.length >= 5) break;
      }
      setData(list);
      setLoading(false);
      return list;
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
