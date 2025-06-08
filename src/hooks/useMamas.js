// src/hooks/useMamas.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useMamas() {
  const { role, mama_id } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMamas = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("mamas").select("*");

    if (role !== "superadmin") query = query.eq("id", mama_id);

    const { data, error } = await query;

    if (!error && data) setMamas(data);
    else console.error("Erreur chargement mamas :", error);

    setLoading(false);
  }, [role, mama_id]);

  useEffect(() => {
    fetchMamas();
  }, [role, mama_id, fetchMamas]);

  return { mamas, loading, refetch: fetchMamas };
}
