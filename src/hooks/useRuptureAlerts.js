// Hook for stock rupture alerts
import { supabase } from '@/lib/supabase';
import { useMamaSettings } from '@/hooks/useMamaSettings';
import { toast } from 'sonner';

export function useRuptureAlerts() {
  const { mamaId } = useMamaSettings();

  async function fetchAlerts() {
    if (!mamaId) return [];
    try {
      const { data, error } = await supabase
        .from('v_alertes_rupture')
        .select(
          'mama_id, produit_id, nom, unite, fournisseur:fournisseur_nom, stock_actuel, stock_min, manque'
        )
        .eq('mama_id', mamaId)
        .order('manque', { ascending: false });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows;
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Erreur chargement alertes rupture');
      return [];
    }
  }

  async function generateSuggestions() {
    if (!mamaId) return { suggestions: [] };
    try {
      const { data, error } = await supabase.functions.invoke(
        'generatePurchaseSuggestions',
        { body: { mama_id: mamaId } }
      );
      if (error) throw error;
      const suggestions = Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];
      return { suggestions };
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Erreur génération suggestions');
      return { suggestions: [] };
    }
  }

  return { fetchAlerts, generateSuggestions };
}
