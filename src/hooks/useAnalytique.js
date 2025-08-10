// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function useAnalytique() {
  const { mama_id } = useAuth();

  const applyPeriode = (query, periode = {}) => {
    if (periode.debut) query = query.gte("date", periode.debut);
    if (periode.fin) query = query.lte("date", periode.fin);
    return query;
  };

  async function getVentilationProduits(periode = {}, centre_id = null) {
    if (!mama_id) return [];
    let query = supabase
      .from("v_analytique_stock")
      .select(
        "famille, activite, cost_center_id, cost_center_nom, sum:quantite, sumv:valeur"
      )
      .eq("mama_id", mama_id)
      .group("famille, activite, cost_center_id, cost_center_nom");
    if (centre_id) query = query.eq("cost_center_id", centre_id);
    query = applyPeriode(query, periode);
    const { data, error } = await query;
    if (error) {
      console.error("getVentilationProduits", error);
      return [];
    }
    return data || [];
  }

  async function getEcartsParFamille(periode = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from("v_analytique_stock")
      .select("famille, sumv:valeur")
      .eq("mama_id", mama_id)
      .group("famille");
    query = applyPeriode(query, periode);
    const { data, error } = await query;
    if (error) {
      console.error("getEcartsParFamille", error);
      return [];
    }
    return data || [];
  }

  async function getConsommationParActivite(periode = {}, centre_id = null) {
    if (!mama_id) return [];
    let query = supabase
      .from("v_analytique_stock")
      .select("activite, sumv:valeur")
      .eq("mama_id", mama_id)
      .group("activite");
    if (centre_id) query = query.eq("cost_center_id", centre_id);
    query = applyPeriode(query, periode);
    const { data, error } = await query;
    if (error) {
      console.error("getConsommationParActivite", error);
      return [];
    }
    return data || [];
  }

  return { getVentilationProduits, getEcartsParFamille, getConsommationParActivite };
}

export default useAnalytique;
