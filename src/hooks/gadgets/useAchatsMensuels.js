import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
        const { data, error } = await supabase
          .from('v_achats_mensuels')
          .select('month:mois, purchases:montant_total')
          .eq('mama_id', mama_id)
          .order('mois', { ascending: true });

        if (error) throw error;

        const rows = Array.isArray(data) ? data : [];
        setData(rows);
      } catch (e) {
        console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
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
