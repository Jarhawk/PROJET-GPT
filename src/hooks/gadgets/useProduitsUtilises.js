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
    const { data, error, status } = await supabase
      .from('requisitions')
      .select(`quantite, date_requisition, produit:produit_id(id, nom, url_photo)`)
      .eq('mama_id', mama_id)
      .gte('date_requisition', start.toISOString().slice(0, 10));
    if (error) {
      console.warn('useProduitsUtilises', { status, error, data }); // ✅ Correction Codex
      setData([]);
      setLoading(false);
      return [];
    }
    setLoading(false);
    const totals = {};
    (data || []).forEach((r) => {
      const id = r.produit?.id;
      if (!totals[id]) {
        totals[id] = { id, nom: r.produit?.nom, url_photo: r.produit?.url_photo, total: 0 }; // ✅ Correction Codex
      }
      totals[id].total += Number(r.quantite || 0);
    });
    const list = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5);
    setData(list);
    if (import.meta.env.DEV) console.log('Chargement dashboard terminé');
    return list;
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
