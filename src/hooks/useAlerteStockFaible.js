import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';

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
        const rows = await safeSelectWithFallback({
          client: supabase,
          table: 'v_alertes_rupture',
          select:
            'id:produit_id, produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_projete, type, mama_id',
          order: { column: 'manque', ascending: false },
        });

        const filtered = rows.filter((r) => r.mama_id === mama_id);
        const paginated = filtered.slice(from, to + 1);

        if (!aborted) {
          setData(paginated);
          setTotal(filtered.length);
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
