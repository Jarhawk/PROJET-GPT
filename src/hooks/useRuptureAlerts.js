// Hook for stock rupture alerts
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useRuptureAlerts() {
  const { mama_id } = useAuth();

  async function fetchAlerts(type = null, traite = null) {
    if (!mama_id) return [];
    let query = supabase
      .from("alertes_rupture")
      .select("*, produit:produit_id(nom)")
      .eq("mama_id", mama_id)
      .order("cree_le", { ascending: false });

    if (type) query = query.eq("type", type);
    if (typeof traite === "boolean") query = query.eq("traite", traite);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function markAsHandled(id) {
    if (!mama_id) return;
    const { error } = await supabase
      .from("alertes_rupture")
      .update({ traite: true })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) throw error;
  }

  async function generateSuggestions() {
    if (!mama_id) return { suggestions: [] };
    const { data, error } = await supabase.functions.invoke(
      "generatePurchaseSuggestions",
      { body: { mama_id } }
    );
    if (error) throw error;
    return data;
  }

  return { fetchAlerts, markAsHandled, generateSuggestions };
}
