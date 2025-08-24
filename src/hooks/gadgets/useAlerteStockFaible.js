import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';

export default function useAlerteStockFaible() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      const rows = await safeSelectWithFallback({
        client: supabase,
        table: 'v_alertes_rupture',
        select: `id:produit_id,
          produit_id,
          nom,
          unite,
          fournisseur_nom,
          stock_actuel,
          stock_min,
          manque,
          consommation_prevue,
          receptions,
          stock_projete,
          mama_id`,
        order: { column: 'manque', ascending: false },
        limit: 50,
      });

      const list = rows
        .filter((r) => r.mama_id === mama_id)
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
      if (import.meta.env.DEV) {
        console.debug('Chargement dashboard terminé');
      }
      return list;
    } catch (e) {
      console.error('useAlerteStockFaible', e.message);
      toast.error(e.message || 'Erreur chargement alertes rupture');
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
