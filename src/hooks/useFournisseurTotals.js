import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFournisseurTotals() {
  const { mama_id } = useAuth();

  async function fetchTotals() {
    const { data, error } = await supabase
      .from('v_fournisseur_totaux')
      .select('*')
      .eq('mama_id', mama_id)
      .order('total_achats', { ascending: false });
    if (error) return [];
    return data || [];
  }

  return { fetchTotals };
}
