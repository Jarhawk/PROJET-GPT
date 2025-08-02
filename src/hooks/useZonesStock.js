import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function useZonesStock() {
  const { mama_id } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mama_id) return;
    const fetchZones = async () => {
      const { data, error } = await supabase
        .from("zones_stock")
        .select("id, nom")
        .eq("mama_id", mama_id)
        .eq("actif", true)
        .order("nom", { ascending: true });
      if (!error) setZones(data);
      setLoading(false);
    };
    fetchZones();
  }, [mama_id]);

  const suggestZones = useCallback(
    async (search = "") => {
      if (!mama_id) return [];
      const { data } = await supabase
        .from("zones_stock")
        .select("id, nom")
        .eq("mama_id", mama_id)
        .ilike("nom", `%${search}%`)
        .order("nom", { ascending: true })
        .limit(10);
      return data || [];
    },
    [mama_id]
  );

  return { zones, loading, suggestZones };
}
