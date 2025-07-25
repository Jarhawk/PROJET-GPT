import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function useTopFournisseurs() {
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
          .from('v_top_fournisseurs')
          .select('fournisseur_id, nom, montant_total')
          .eq('mama_id', mama_id);

        if (error) throw error;

        const rows = (data || []).map((r) => ({
          id: r.fournisseur_id,
          nom: r.nom,
          total: r.montant_total,
        }));
        setData(rows);
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
