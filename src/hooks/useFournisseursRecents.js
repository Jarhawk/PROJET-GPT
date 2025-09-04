// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

export default function useFournisseursRecents(limit = 10) {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mama_id) return;
    let aborted = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.
        from('fournisseurs_recents').
        select('id, nom, ville').
        eq('mama_id', mama_id).
        order('dernier_achat', { ascending: false }).
        limit(limit);
        if (error) throw error;
        if (!aborted) setData(data || []);
      } catch (err) {
        console.error(err);
        if (!aborted) {
          setError(err);
          setData([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [mama_id, limit]);

  return { data, loading, error };
}