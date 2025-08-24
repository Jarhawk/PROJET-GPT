import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useTopFournisseurs() {
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
          .from('v_top_fournisseurs')
          .select('fournisseur_id, montant, mois')
          .eq('mama_id', mama_id);

        if (error) throw error;

        const rows = (data || []).map((r) => ({
          id: r.fournisseur_id,
          montant: r.montant,
          mois: r.mois,
        }));
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
