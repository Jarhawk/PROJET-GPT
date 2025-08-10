// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function useAnalyse() {
  const { mama_id } = useAuth();

  const applyPeriode = (query, { debut, fin } = {}) => {
    if (debut) query = query.gte("mois", debut);
    if (fin) query = query.lte("mois", fin);
    return query;
  };

  async function getMonthlyPurchases(filters = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from("v_achats_mensuels")
      .select("mois, montant_total")
      .eq("mama_id", mama_id)
      .order("mois", { ascending: true });
    query = applyPeriode(query, filters);
    const { data, error } = await query;
    if (error) {
      console.error("getMonthlyPurchases", error);
      return [];
    }
    return data || [];
  }

  async function getEvolutionAchats(filters = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from("v_evolution_achats")
      .select("mois, montant")
      .eq("mama_id", mama_id)
      .order("mois", { ascending: true });
    query = applyPeriode(query, filters);
    const { data, error } = await query;
    if (error) {
      console.error("getEvolutionAchats", error);
      return [];
    }
    return data || [];
  }

  async function getPmp() {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("v_pmp")
      .select("*")
      .eq("mama_id", mama_id);
    if (error) {
      console.error("getPmp", error);
      return [];
    }
    return data || [];
  }

  async function getEcartsInventaire(filters = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from("v_ecarts_inventaire")
      .select("date, ecart")
      .eq("mama_id", mama_id)
      .order("date", { ascending: true });
    if (filters.produit_id) query = query.eq("produit_id", filters.produit_id);
    const { data, error } = await query;
    if (error) {
      console.error("getEcartsInventaire", error);
      return [];
    }
    return data || [];
  }

  return { getMonthlyPurchases, getEvolutionAchats, getPmp, getEcartsInventaire };
}

export default useAnalyse;
