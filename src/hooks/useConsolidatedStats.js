// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useConsolidatedStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchStats() {
    setLoading(true);
    const { data, error } = await supabase.rpc("consolidated_stats");
    setLoading(false);
    if (error) {
      console.error('Erreur consolidated_stats:', error);
      setError(error.message || error);
      setStats([]);
      return [];
    }
    setStats(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { stats, loading, error, fetchStats };
}
