import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function useFournisseursAutocomplete() {
  const { mama_id } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchFournisseurs = useCallback(async (query = "") => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("fournisseurs")
      .select("id, nom")
      .eq("mama_id", mama_id)
      .eq("actif", true);
    if (query) {
      q = q.ilike("nom", `%${query}%`);
    }
    q = q.order("nom", { ascending: true }).limit(10);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setResults(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  return { results, loading, error, searchFournisseurs };
}
