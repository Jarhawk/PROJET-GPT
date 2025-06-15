import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useCostCenterMonthlyStats() {
  const { mama_id } = useAuth();

  async function fetchMonthly({ debut = null, fin = null } = {}) {
    let query = supabase
      .from('v_cost_center_monthly')
      .select('*')
      .eq('mama_id', mama_id)
      .order('mois', { ascending: true })
      .order('nom', { ascending: true });
    if (debut) query = query.gte('mois', debut);
    if (fin) query = query.lte('mois', fin);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  return { fetchMonthly };
}
