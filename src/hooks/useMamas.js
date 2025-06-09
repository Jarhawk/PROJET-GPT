// src/hooks/useMamas.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useMamas() {
  const { role, mama_id } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMamas = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("mamas").select("*");

    if (role !== "superadmin") query = query.eq("id", mama_id);

    const { data, error } = await query;
    if (error) {
      console.error("Erreur chargement mamas :", error);
      setError(error);
      setMamas([]);
    } else {
      setMamas(data || []);
      setError(null);
    }

    setLoading(false);
  }, [role, mama_id]);

  useEffect(() => {
    fetchMamas();
  }, [role, mama_id, fetchMamas]);

  return { mamas, loading, error, refetch: fetchMamas };
}
