import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { logSupaError } from '@/lib/supa/logError';
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
      const base = supabase.from('v_alertes_rupture');
      const selectWith = `id:produit_id,
          produit_id,
          nom,
          unite,
          fournisseur_nom,
          stock_actuel,
          stock_min,
          manque,
          consommation_prevue,
          receptions,
          stock_projete`;

      let { data, error } = await base
        .select(selectWith).eq('mama_id', mama_id)
        .order('manque', { ascending: false })
        .limit(50);

      if (error && error.code === '42703') {
        if (import.meta.env.DEV)
          console.debug('v_alertes_rupture sans stock_projete');
        const { data: d2, error: e2 } = await base
          .select(`id:produit_id,
          produit_id,
          nom,
          unite,
          fournisseur_nom,
          stock_actuel,
          stock_min,
          manque,
          consommation_prevue,
          receptions,
          stock_previsionnel`).eq('mama_id', mama_id)
          .order('manque', { ascending: false })
          .limit(50);
        if (e2) {
          logSupaError('v_alertes_rupture', e2);
          throw e2;
        }
        data = (d2 ?? []).map((r) => ({
          ...r,
          stock_projete: r.stock_previsionnel ?? ((r.stock_actuel ?? 0) + (r.receptions ?? 0) - (r.consommation_prevue ?? 0)),
        }));
      } else {
        if (error) {
          logSupaError('v_alertes_rupture', error);
          throw error;
        }
        if (import.meta.env.DEV)
          console.debug('v_alertes_rupture avec stock_projete');
      }

      const list = (data || [])
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
