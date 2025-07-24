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
    const { data, error, status } = await supabase
      .from('v_top_fournisseurs')
      .select('fournisseur_id, montant') // ✅ Correction Codex
      .eq('mama_id', mama_id)
      .order('montant', { ascending: false })
      .limit(3);
    if (error) {
      console.warn('useTopFournisseurs', { status, error, data }); // ✅ Correction Codex
      setData([]);
      setLoading(false);
      return [];
    }
    const ids = (data || []).map((r) => r.fournisseur_id);
    const { data: names } = await supabase
      .from('fournisseurs')
      .select('id, nom')
      .eq('mama_id', mama_id)
      .in('id', ids);
    const nameMap = Object.fromEntries((names || []).map((n) => [n.id, n.nom]));
    const list = (data || []).map((row) => ({
      id: row.fournisseur_id,
      nom: nameMap[row.fournisseur_id] || '',
      total: Number(row.montant || 0),
    })); // ✅ Correction Codex
    setLoading(false);
    setData(list);
    if (import.meta.env.DEV) console.log('Chargement dashboard terminé');
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
