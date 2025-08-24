import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';

export default function useTopFournisseurs() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [topFournisseurs, setTopFournisseurs] = useState([]);
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
          select: 'id:fournisseur_id, montant, mois',
          filters: (q) => q.eq('mama_id', mama_id),
        });

        setTopFournisseurs(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
        setError(e);
        setTopFournisseurs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, mama_id]);

  return { data: topFournisseurs, loading, error };
}
