import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';
import { toast } from 'sonner';

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
      const select =
        'mama_id,id:produit_id,produit_id,nom,unite,fournisseur_nom,stock_actuel,stock_min,consommation_prevue,receptions,manque,type,stock_projete';

      const rows = await safeSelectWithFallback({
        client: supabase,
        table: 'v_alertes_rupture',
        select,
        order: { column: 'manque', ascending: false },
        limit: 50,
        transform: (rows) => (rows || []).filter(r => r.mama_id === mama_id),
      });

      const list = (rows || [])
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
      console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
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
