import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';

export default function useTopFournisseurs() {
  const [topFournisseurs, setTopFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopFournisseurs = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await safeSelectWithFallback({
          client: supabase,
          table: 'v_top_fournisseurs',
          select: 'fournisseur_id, montant, mois',
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

    fetchTopFournisseurs();
  }, []);

  return { data: topFournisseurs, loading, error };
}

