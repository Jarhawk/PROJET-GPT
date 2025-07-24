import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useDerniersAcces() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from('logs_securite')
      .select('user_id, created_at, utilisateur:utilisateurs(email, auth_id)')
      .eq('mama_id', mama_id)
      .order('created_at', { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    const seen = {};
    const list = [];
    for (const row of data || []) {
      if (!row.user_id || seen[row.user_id]) continue;
      seen[row.user_id] = true;
      list.push({
        id: row.user_id,
        email: row.utilisateur?.email,
        date: row.created_at,
      });
      if (list.length >= 5) break;
    }
    setData(list);
    console.log('Chargement dashboard terminé');
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
