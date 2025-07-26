import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useAuth from '@/hooks/useAuth';

export default function useProduitsUtilises() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const { data, error } = await supabase
        .from('v_produits_utilises') // ✅ Correction Codex
        .select('produit_id, produit_nom, quantite, date_utilisation') // ✅ Correction Codex
        .eq('mama_id', mama_id) // ✅ Correction Codex
        .gte('date_utilisation', start.toISOString().slice(0, 10)); // ✅ Correction Codex
      if (error) throw error;
      const totals = {};
      (data || []).forEach((r) => {
        const id = r.produit_id; // ✅ Correction Codex
        if (!totals[id]) {
          totals[id] = { id, nom: r.produit_nom, total: 0 }; // ✅ Correction Codex
        }
        totals[id].total += Number(r.quantite || 0); // ✅ Correction Codex
      });
      const list = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5);
      setData(list);
      if (import.meta.env.DEV) console.log('Chargement dashboard terminé');
      return list;
    } catch (e) {
      console.warn('useProduitsUtilises', e);
      setError(e);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
