import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function useEvolutionAchats() {
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
        const start = new Date();
        start.setMonth(start.getMonth() - 12);
        const filterDate = new Date(start.getFullYear(), start.getMonth(), 1).toISOString();
        const { data, error } = await supabase
          .from('v_evolution_achats')
          .select('mois, montant')
          .eq('mama_id', mama_id)
          .gte('mois', filterDate)
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
