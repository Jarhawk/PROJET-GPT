// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useCostCenterStats() {
  const { mama_id } = useAuth();

  async function fetchStats({ debut = null, fin = null } = {}) {
    if (!mama_id) return [];
    const { data, error } = await supabase.rpc("stats_cost_centers", {
      mama_id_param: mama_id,
      debut_param: debut,
      fin_param: fin,
    });
    if (error) {
      console.error('Erreur stats_cost_centers:', error);
      return [];
    }
    return data || [];
  }

  return { fetchStats };
}
