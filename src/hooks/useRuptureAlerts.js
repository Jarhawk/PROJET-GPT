import { supabase } from '@/lib/supabaseClient'; // Hook for stock rupture alerts
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts(type = null) {
    if (!mama_id) return [];
    const base = supabase
      .from('v_alertes_rupture_api')
      .select(
        'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_projete, type'
      )
      .order('manque', { ascending: false });
    const query = type ? base.eq('type', type) : base;
    const { data, error } = await run(query);
    if (error) {
      logError('[v_alertes_rupture_api]', error);
      return [];
    }
    return data ?? [];
  }

  async function generateSuggestions() {
    if (!mama_id) return { suggestions: [] };
    try {
      const { data, error } = await supabase.functions.invoke('generatePurchaseSuggestions', {
        body: { mama_id },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      logError('[generatePurchaseSuggestions]', error);
      return { suggestions: [] };
    }
  }

  return { fetchAlerts, generateSuggestions };
}