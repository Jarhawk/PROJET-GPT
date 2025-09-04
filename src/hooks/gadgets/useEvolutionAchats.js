import supabase from '@/lib/supabase';import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { createAsyncState } from '../_shared/createAsyncState';

export default function useEvolutionAchats() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [state, setState] = useState(() => createAsyncState([]));

  useEffect(() => {
    if (authLoading) return;
    if (!mama_id) return;

    const fetchData = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const start = new Date();
        start.setMonth(start.getMonth() - 12);
        const filterDate = new Date(start.getFullYear(), start.getMonth(), 1).toISOString();
        const { data, error } = await supabase.
        from('v_evolution_achats').
        select('mois, montant').
        eq('mama_id', mama_id).
        gte('mois', filterDate).
        order('mois', { ascending: true });

        if (error) throw error;

        setState({ data: data || [], loading: false, error: null });
      } catch (e) {
        setState({ data: [], loading: false, error: e });
      }
    };

    fetchData();
  }, [authLoading, mama_id]);

  const loading = authLoading || state.loading;

  return { data: state.data, loading, error: state.error };
}