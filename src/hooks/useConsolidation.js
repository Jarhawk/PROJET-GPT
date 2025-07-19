// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useConsolidation() {
  const { mama_id, isSuperadmin } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchStats() {
    setLoading(true);
    let query = supabase.from("v_consolidated_stats").select("*");
    if (!isSuperadmin) {
      query = query.eq("mama_id", mama_id);
    }
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setStats([]);
      return [];
    }
    setError(null);
    setStats(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { stats, loading, error, fetchStats };
}

export default useConsolidation;
