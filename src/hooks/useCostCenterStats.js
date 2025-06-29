// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useCostCenterStats() {
  const { mama_id } = useAuth();

  async function fetchStats({ debut = null, fin = null } = {}) {
    if (!mama_id) return [];
    const { data, error } = await supabase.rpc("stats_cost_centers", {
      mama_id_param: mama_id,
      debut_param: debut,
      fin_param: fin,
    });
    if (error) return [];
    return data || [];
  }

  return { fetchStats };
}
