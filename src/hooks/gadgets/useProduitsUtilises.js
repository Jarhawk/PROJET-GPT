import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useProduitsUtilises() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const { data, error } = await supabase
      .from('requisitions')
      .select(`quantite, date_requisition, produit:produits(id, nom, photo_url)`) 
      .eq('mama_id', mama_id)
      .gte('date_requisition', start.toISOString().slice(0, 10));
    setLoading(false);
    if (error) {
      console.error(error);
      setData([]);
      return [];
    }
    const totals = {};
    (data || []).forEach((r) => {
      const id = r.produit?.id;
      if (!totals[id]) {
        totals[id] = { id, nom: r.produit?.nom, photo_url: r.produit?.photo_url, total: 0 };
      }
      totals[id].total += Number(r.quantite || 0);
    });
    const list = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5);
    setData(list);
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
