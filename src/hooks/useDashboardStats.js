import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useDashboardStats() {
  const { mama_id } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc("dashboard_stats", { mama_id_param: mama_id }); // Utilise ta fonction stockée si elle existe
      if (error) throw error;
      setStats(data);
    } catch (err) {
      setError(err.message || "Erreur récupération stats dashboard.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, error, fetchStats };
}
