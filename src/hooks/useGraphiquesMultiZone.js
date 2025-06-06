// src/hooks/useGraphiquesMultiZone.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useGraphiquesMultiZone({ startDate, endDate }) {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("factures")
      .select("date, total_ht")
      .eq("mama_id", mama_id)
      .order("date", { ascending: true });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;

    if (!error && data) setData(data);
    else console.error("Erreur graphique multi-zone", error);

    setLoading(false);
  };

  useEffect(() => {
    if (mama_id) fetchData();
  }, [mama_id, startDate, endDate]);

  return { data, loading, refetch: fetchData };
}
