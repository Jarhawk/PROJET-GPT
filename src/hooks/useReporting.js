import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useReporting() {
  const { mama_id } = useAuth();

  const applyFilters = (query, filters = {}) => {
    if (filters.date_start) query = query.gte("date", filters.date_start);
    if (filters.date_end) query = query.lte("date", filters.date_end);
    if (filters.fournisseur) query = query.eq("fournisseur", filters.fournisseur);
    if (filters.famille) query = query.eq("famille", filters.famille);
    if (filters.fiche) query = query.eq("fiche_id", filters.fiche);
    if (filters.cost_center) query = query.eq("cost_center_id", filters.cost_center);
    return query;
  };

  async function getIndicators({ date_start, date_end } = {}) {
    if (!mama_id) return {};
    const { data, error } = await supabase
      .from("v_stock_valorise")
      .select("cout_matiere_total, evolution_pmp, food_cost, ecart_inventaire")
      .eq("mama_id", mama_id)
      .gte("date", date_start)
      .lte("date", date_end)
      .single();
    if (error) {
      console.error("getIndicators", error);
      return {};
    }
    return data || {};
  }

  async function getGraphData(type, filters = {}) {
    if (!mama_id) return [];
    let query;
    switch (type) {
      case "achats":
        query = supabase.from("v_achats_par_mois").select("*");
        break;
      case "pmp":
        query = supabase.from("v_stock_valorise").select("*");
        break;
      case "familles":
        query = supabase.from("v_fiches_techniques_cout").select("*");
        break;
      case "cost_center":
        query = supabase.from("v_cost_center_month").select("*");
        break;
      default:
        return [];
    }
    query = query.eq("mama_id", mama_id);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) {
      console.error("getGraphData", error);
      return [];
    }
    return data || [];
  }

  async function getEcartInventaire(filters = {}) {
    if (!mama_id) return [];
    let query = supabase.from("v_ecarts_inventaire").select("*").eq("mama_id", mama_id);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) {
      console.error("getEcartInventaire", error);
      return [];
    }
    return data || [];
  }

  async function getCostCenterBreakdown(filters = {}) {
    if (!mama_id) return [];
    let query = supabase.from("v_cost_center_month").select("*").eq("mama_id", mama_id);
    if (filters.date_start) query = query.gte("mois", filters.date_start);
    if (filters.date_end) query = query.lte("mois", filters.date_end);
    const { data, error } = await query;
    if (error) {
      console.error("getCostCenterBreakdown", error);
      return [];
    }
    return data || [];
  }

  return { getIndicators, getGraphData, getEcartInventaire, getCostCenterBreakdown };
}

export default useReporting;
