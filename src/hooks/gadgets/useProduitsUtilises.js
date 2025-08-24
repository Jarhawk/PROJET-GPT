import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useProduitsUtilises() {
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
        .from('v_produits_utilises')
        .select('produit_id, produit_nom, quantite, date_utilisation')
        .eq('mama_id', mama_id)
        .gte('date_utilisation', start.toISOString().slice(0, 10));
      if (error) throw error;
      const totals = {};
      (data || []).forEach((r) => {
        const id = r.produit_id;
        if (!totals[id]) {
          totals[id] = { id, nom: r.produit_nom, total: 0 };
        }
        totals[id].total += Number(r.quantite || 0);
      });
      const list = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5);
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
