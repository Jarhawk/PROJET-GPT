// Hook for stock rupture alerts
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts(type = null) {
    if (!mama_id) return [];
    try {
      let query = supabase
        .from('v_alertes_rupture')
        .select(
          'id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, stock_projete, manque, type'
        )
        .order('manque', { ascending: false });

      if (type) query = query.eq('type', type);

      const { data, error } = await query;
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
