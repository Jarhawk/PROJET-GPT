import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useTopFournisseurs() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const start = new Date();
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);
    const { data, error } = await supabase
      .from('v_top_fournisseurs')
      .select('fournisseur_id, montant, fournisseurs(id, nom)')
      .eq('mama_id', mama_id)
      .order('montant', { ascending: false })
      .limit(3);
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    const list = (data || []).map((row) => ({
      id: row.fournisseur_id,
      nom: row.fournisseurs?.nom,
      total: Number(row.montant || 0),
    }));
    setData(list);
    if (import.meta.env.DEV) console.log('Chargement dashboard terminé');
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
