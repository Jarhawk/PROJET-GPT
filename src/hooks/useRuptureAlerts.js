// Hook for stock rupture alerts
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts() {
    if (!mama_id) return [];
    try {
      const { data, error } = await supabase
        .from('v_alertes_rupture')
        .select(
          'mama_id, id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, manque'
        )
        .eq('mama_id', mama_id)
        .order('manque', { ascending: false });
      if (error) throw error;
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
