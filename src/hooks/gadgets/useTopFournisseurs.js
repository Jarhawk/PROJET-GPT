import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';

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
        const rows = await safeSelectWithFallback({
          client: supabase,
          table: 'v_top_fournisseurs',
          select: 'fournisseur_id, montant, mois, mama_id',
          transform: (data) =>
            (data || [])
              .filter((r) => r.mama_id === mama_id)
              .map((r) => ({
                id: r.fournisseur_id,
                montant: r.montant,
                mois: r.mois,
              })),
        });
        setData(rows);
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
