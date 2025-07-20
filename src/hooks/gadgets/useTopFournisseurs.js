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
      .from('achats')
      .select(
        'prix, quantite, fournisseur_id, fournisseurs(id, nom, logo_url)'
      )
      .eq('mama_id', mama_id)
      .gte('date_achat', start.toISOString().slice(0, 10))
      .lt('date_achat', end.toISOString().slice(0, 10));
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    const totals = {};
    (data || []).forEach((a) => {
      const id = a.fournisseur_id;
      if (!totals[id]) {
        totals[id] = {
          id,
          nom: a.fournisseurs?.nom,
          logo_url: a.fournisseurs?.logo_url,
          total: 0,
        };
      }
      totals[id].total += Number(a.prix || 0) * Number(a.quantite || 1);
    });
    const list = Object.values(totals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    setData(list);
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
