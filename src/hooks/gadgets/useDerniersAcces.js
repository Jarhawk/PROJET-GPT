import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useDerniersAcces() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('logs_securite')
        .select(
          'utilisateur_id, created_at, utilisateur:utilisateurs!logs_securite_utilisateur_id_fkey(email, auth_id)'
        )
        .eq('mama_id', mama_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const seen = {};
      const list = [];
      for (const row of rows) {
        if (!row.utilisateur_id || seen[row.utilisateur_id]) continue;
        seen[row.utilisateur_id] = true;
        list.push({
          id: row.utilisateur_id,
          email: row.utilisateur?.email,
          date: row.created_at,
        });
        if (list.length >= 5) break;
      }
      setData(list);
      if (import.meta.env.DEV) {
        console.debug('Chargement dashboard terminé');
      }
      return list;
    } catch (e) {
      console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
      setError(e);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [mama_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
