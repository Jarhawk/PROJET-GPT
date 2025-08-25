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
        // Columns: mama_id, produit_id, nom, unite, fournisseur_nom, stock_min, stock_actuel, manque
        const { data: rows, count, error } = await supabase
          .from('v_alertes_rupture')
          .select(
            'mama_id, produit_id, nom, unite, fournisseur_nom, stock_min, stock_actuel, manque',
            { count: 'exact' }
          )
          .eq('mama_id', mama_id)
          .order('manque', { ascending: false })
          .range(from, to);
        if (error) throw error;
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
