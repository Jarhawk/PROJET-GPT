import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAdvancedStats() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchStats({ start, end } = {}) {
    setLoading(true);
    const { data, error } = await supabase.rpc("advanced_stats", {
      start_date: start || null,
      end_date: end || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setData([]);
      return [];
    }
    setData(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { data, loading, error, fetchStats };
}
