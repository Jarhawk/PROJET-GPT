import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';

export default function useProduitsUtilises() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (signal) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const { data: rows, error: err } = await run(
        supabase
          .from('v_produits_utilises')
          .select('produit_id, produit_nom, quantite, date_utilisation')
          .eq('mama_id', mama_id)
          .gte('date_utilisation', start.toISOString().slice(0, 10))
          .abortSignal(signal)
      );
      if (err) {
        logError('useProduitsUtilises', err);
        setError(err);
        setData([]);
        setLoading(false);
        return [];
      }
      const totals = {};
      (rows || []).forEach((r) => {
        const id = r.produit_id;
        if (!totals[id]) {
          totals[id] = { id, nom: r.produit_nom, total: 0 };
        }
        totals[id].total += Number(r.quantite || 0);
      });
      const list = Object.values(totals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setData(list);
      setLoading(false);
      return list;
    },
    [mama_id]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    return fetchData(controller.signal);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
