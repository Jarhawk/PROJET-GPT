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
          'id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, stock_projete, manque, type, traite'
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

  async function markAsHandled(id) {
    if (!mama_id) return;
    try {
      const { error } = await supabase
        .from('alertes_rupture')
        .update({ traite: true })
        .eq('id', id)
        .eq('mama_id', mama_id);
      if (error) throw error;
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Erreur mise à jour alerte');
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

  return { fetchAlerts, markAsHandled, generateSuggestions };
}
