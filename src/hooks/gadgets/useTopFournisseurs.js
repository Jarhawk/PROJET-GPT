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
          .from('v_top_fournisseurs') // ✅ Correction Codex
          .select('fournisseur_id, montant, mois') // ✅ Correction Codex
          .eq('mama_id', mama_id); // ✅ Correction Codex

        if (error) throw error;

        const rows = (data || []).map((r) => ({
          id: r.fournisseur_id, // ✅ Correction Codex
          montant: r.montant, // ✅ Correction Codex
          mois: r.mois, // ✅ Correction Codex
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
