import supabase from '@/lib/supabase'; // Hook for stock rupture alerts

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts(type = null) {
    if (!mama_id) return [];
    try {
      const base = supabase.from('v_alertes_rupture').eq('mama_id', mama_id);
      const selectWith =
      'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, consommation_prevue, receptions, stock_projete, manque, type';

      let query = base.select(selectWith).order('manque', { ascending: false });
      if (type) query = query.eq('type', type);
      let { data, error } = await query;

      if (error && error.code === '42703') {
        if (import.meta.env.DEV)
        console.debug('v_alertes_rupture sans stock_projete');
        let q2 = base.
        select(
          'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, consommation_prevue, receptions, manque, type'
        ).
        order('manque', { ascending: false });
        if (type) q2 = q2.eq('type', type);
        const { data: d2, error: e2 } = await q2;
        if (e2) throw e2;
        data = (d2 ?? []).map((r) => ({
          ...r,
          stock_projete:
          r.stock_actuel != null ||
          r.receptions != null ||
          r.consommation_prevue != null ?
          (r.stock_actuel ?? 0) + (
          r.receptions ?? 0) - (
          r.consommation_prevue ?? 0) :
          null
        }));
      } else {
        if (error) throw error;
        if (import.meta.env.DEV)
        console.debug('v_alertes_rupture avec stock_projete');
      }

      return data || [];
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Erreur chargement alertes rupture');
      return [];
    }
  }

  async function generateSuggestions() {
    if (!mama_id) return { suggestions: [] };
    try {
      const { data, error } = await supabase.functions.invoke(
        'generatePurchaseSuggestions',
        { body: { mama_id } }
      );
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Erreur génération suggestions');
      return { suggestions: [] };
    }
  }

  return { fetchAlerts, generateSuggestions };
}