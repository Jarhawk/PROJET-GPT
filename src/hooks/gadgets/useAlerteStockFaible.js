import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';

export default function useAlerteStockFaible() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (signal) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await run(
        supabase
          .from('v_alertes_rupture_api')
          .select(
            'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_projete'
          )
          .order('manque', { ascending: false })
          .limit(50)
          .abortSignal(signal)
      );
      if (err) {
        logError('v_alertes_rupture_api', err);
        setError(err);
        setData([]);
        setLoading(false);
        return [];
      }
      const list = (rows ?? [])
        .map((p) => ({
          produit_id: p.produit_id,
          nom: p.nom,
          stock_actuel: p.stock_actuel,
          stock_min: p.stock_min,
          unite: p.unite,
          fournisseur_nom: p.fournisseur_nom,
        }))
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
