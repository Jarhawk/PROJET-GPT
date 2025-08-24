// Hook for stock rupture alerts
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { safeSelectWithFallback } from '@/lib/supa/safeSelect';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts(type = null) {
    if (!mama_id) return [];
    try {
      const rows = await safeSelectWithFallback({
        client: supabase,
        table: 'v_alertes_rupture',
        select:
          'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, consommation_prevue, receptions, stock_projete, manque, type, mama_id',
        order: { column: 'manque', ascending: false },
      });

      return rows.filter(
        (r) => r.mama_id === mama_id && (!type || r.type === type)
      );
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
