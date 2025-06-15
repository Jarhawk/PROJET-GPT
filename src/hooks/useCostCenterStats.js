import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useCostCenterStats() {
  const { mama_id } = useAuth();

  async function fetchStats({ debut = null, fin = null } = {}) {
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
