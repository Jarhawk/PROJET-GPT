import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { logSupaError } from '@/lib/supa/logError';
import { toast } from 'sonner';
import { resolveAlertesRuptureSource } from '@/lib/resolveAlertesRuptureSource';

export default function useAlerteStockFaible() {
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
      const source = await resolveAlertesRuptureSource(supabase);
      const { data, error } = await supabase
        .from(source)
        .select(
          `id,
          mama_id,
          produit_id,
          traite,
          cree_le,
          stock_actuel,
          stock_min,
          produit:produits ( id, nom )`
        )
        .eq('mama_id', mama_id)
        .is('traite', false)
        .order('cree_le', { ascending: false });

      if (error) {
        logSupaError('alertes_rupture', error);
        throw error;
      }

      const list = (data || [])
        .filter(
          (p) =>
            typeof p.stock_min === 'number' &&
            typeof p.stock_actuel === 'number' &&
            p.stock_actuel < p.stock_min
        )
        .map((p) => ({
          produit_id: p.produit_id,
          nom: p.produit?.nom,
          stock_reel: p.stock_actuel,
          stock_min: p.stock_min,
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
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
