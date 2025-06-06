// src/hooks/useMamas.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useMamas() {
  const { role, mama_id } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMamas = async () => {
    setLoading(true);
    let query = supabase.from("mamas").select("*");

    if (role !== "superadmin") query = query.eq("id", mama_id);

    const { data, error } = await query;

    if (!error && data) setMamas(data);
    else console.error("Erreur chargement mamas :", error);

    setLoading(false);
  };

  useEffect(() => {
    fetchMamas();
  }, [role, mama_id]);

  return { mamas, loading, refetch: fetchMamas };
}
