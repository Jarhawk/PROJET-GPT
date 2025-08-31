import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useEvolutionAchats() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!mama_id) return;

    const fetchData = async () => {
      setIsLoading(true);
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

        const rows = Array.isArray(data) ? data : [];
        setData(rows);
      } catch (e) {
        console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
        setError(e);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authLoading, mama_id]);

  const loading = [authLoading, isLoading].some(Boolean);

  return { data, loading, error };
}
