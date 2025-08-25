import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useTopFournisseurs() {
  const { mama_id } = useAuth();
  const [topFournisseurs, setTopFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopFournisseurs = async () => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('v_top_fournisseurs')
          .select('fournisseur_id, montant, mois')
          .eq('mama_id', mama_id)
          .order('montant', { ascending: false })
          .limit(5);
        if (error) throw error;
        setTopFournisseurs(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e);
        setTopFournisseurs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopFournisseurs();
  }, [mama_id]);

  return { data: topFournisseurs, loading, error };
}

