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
      const { data, error } = await supabase
        .from('v_top_fournisseurs')
        .select(
          'fournisseur_id, fournisseur, montant_total, nombre_achats, mama_id'
        )
        .eq('mama_id', mama_id);

      if (error) {
        setError(error);
        setData([]);
      } else {
        setData(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [mama_id]);

  return { data, loading, error };
}
