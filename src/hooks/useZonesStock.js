import { useEffect, useState, useCallback } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from "@/hooks/useAuth";

export async function fetchZonesForValidation(mama_id) {
  return await supabase.from("zones_stock").select("id, nom").eq("mama_id", mama_id);
}

export default function useZonesStock() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!mama_id) return;
    const fetchZones = async () => {
      const { data, error } = await supabase
        .from("zones_stock")
        .select("id, nom")
        .eq("mama_id", mama_id)
        .eq("actif", true)
        .order("nom", { ascending: true });
      if (!error) setZones(data);
      setIsLoading(false);
    };
    fetchZones();
  }, [authLoading, mama_id]);

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

  const loading = [authLoading, isLoading].some(Boolean);

  return { zones, loading, suggestZones };
}
