import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createAsyncState } from '../_shared/createAsyncState';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';

export default function useEvolutionAchats() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [state, setState] = useState(() => createAsyncState([]));

  const fetchData = useCallback(
    async (signal) => {
      if (!mama_id) return [];
      setState((s) => ({ ...s, loading: true, error: null }));
      const start = new Date();
      start.setMonth(start.getMonth() - 12);
      const filterDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
      const { data, error } = await run(
        supabase
          .from('v_evolution_achats')
          .select('mois, montant')
          .eq('mama_id', mama_id)
          .gte('mois', filterDate)
          .order('mois', { ascending: true })
          .abortSignal(signal)
      );
      if (error) {
        logError('useEvolutionAchats', error);
        setState({ data: [], loading: false, error });
        return [];
      }
      setState({ data: data ?? [], loading: false, error: null });
      return data ?? [];
    },
    [mama_id]
  );

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [authLoading, fetchData]);

  const loading = authLoading || state.loading;
  return { data: state.data, loading, error: state.error };
}
