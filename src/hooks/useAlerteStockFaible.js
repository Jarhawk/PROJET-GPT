import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';
import { applyRange } from '@/lib/supa/applyRange';

/**
 * Hook for low stock alerts based on v_alertes_rupture_api view.
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=20]
 */
export function useAlerteStockFaible({ page = 1, pageSize = 20 } = {}) {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (signal) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const base = supabase
        .from('v_alertes_rupture_api')
        .select(
          'id:produit_id, produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_projete'
        )
        .order('manque', { ascending: false });
      const { data: rows, error: err } = await run(
        applyRange(base, from, pageSize).abortSignal(signal)
      );
      if (err) {
        logError('[v_alertes_rupture_api]', err);
        setData([]);
        setTotal(0);
        setError(err);
        setLoading(false);
        return [];
      }
      setData(rows ?? []);
      setTotal(rows?.length ?? 0);
      setLoading(false);
      return rows ?? [];
    },
    [mama_id, page, pageSize]
  );

  useEffect(() => {
    if (!mama_id) return;
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [mama_id, fetchData]);

  return { data, total, page, pageSize, loading, error };
}
export default useAlerteStockFaible;
