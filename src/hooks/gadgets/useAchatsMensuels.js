import supabase from '@/lib/supabase';import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

export default function useAchatsMensuels() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!mama_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.
        from('v_achats_mensuels').
        select('mois, montant').
        eq('mama_id', mama_id).
        order('mois', { ascending: true });

        if (error) throw error;

        setData(data || []);
      } catch (e) {
        setError(e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, mama_id]);

  return { data, loading, error };
}