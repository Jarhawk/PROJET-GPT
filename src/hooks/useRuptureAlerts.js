// Hook for stock rupture alerts
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { resolveAlertesRuptureSource } from '@/lib/resolveAlertesRuptureSource';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts(type = null, traite = null) {
    if (!mama_id) return [];
    try {
      const source = await resolveAlertesRuptureSource(supabase);
      let query = supabase
        .from(source)
        .select('*, produit:produit_id(nom)')
        .eq('mama_id', mama_id)
        .order('cree_le', { ascending: false });

      if (type) query = query.eq('type', type);
      if (typeof traite === 'boolean') query = query.eq('traite', traite);

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
