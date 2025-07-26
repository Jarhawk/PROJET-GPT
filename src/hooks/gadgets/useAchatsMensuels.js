import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function useAchatsMensuels() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mama_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('v_achats_mensuels') // ✅ Correction Codex
          .select('mois, montant') // ✅ Correction Codex
          .eq('mama_id', mama_id) // ✅ Correction Codex
          .order('mois', { ascending: true });

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
  }, [mama_id]);

  return { data, loading, error };
}
