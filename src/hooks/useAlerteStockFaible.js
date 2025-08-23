import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for low stock alerts based on v_alertes_rupture view.
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

  useEffect(() => {
    if (!mama_id) return;
    let aborted = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      try {
        const base = supabase.from('v_alertes_rupture');
        const selectWith =
          'id:produit_id, produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_projete';

        let { data: rows, count, error } = await base
          .select(selectWith, { count: 'exact' }).eq('mama_id', mama_id)
          .order('manque', { ascending: false })
          .range(from, to);

        if (error && error.code === '42703') {
          if (import.meta.env.DEV)
            console.debug('v_alertes_rupture sans stock_projete');
          const { data: d2, count: c2, error: e2 } = await base
            .select('id:produit_id, produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_previsionnel', { count: 'exact' }).eq('mama_id', mama_id)
            .order('manque', { ascending: false })
            .range(from, to);
          if (e2) throw e2;
          rows = (d2 ?? []).map((r) => ({
            ...r,
            stock_projete: r.stock_previsionnel ?? ((r.stock_actuel ?? 0) + (r.receptions ?? 0) - (r.consommation_prevue ?? 0)),
          }));
          count = c2 || 0;
        } else {
          if (error) throw error;
          if (import.meta.env.DEV)
            console.debug('v_alertes_rupture avec stock_projete');
        }

        if (!aborted) {
          setData(rows || []);
          setTotal(count || 0);
        }
      } catch (err) {
        console.error(err);
        if (!aborted) {
          setError(err);
          setData([]);
          toast.error(err.message || 'Erreur récupération alertes rupture');
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      aborted = true;
    };
  }, [mama_id, page, pageSize]);

  return { data, total, page, pageSize, loading, error };
}
export default useAlerteStockFaible;
