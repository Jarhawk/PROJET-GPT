import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFacturesAutocomplete() {
  const { mama_id } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchFactures = useCallback(async (query = "") => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("factures")
      .select("id, numero, date, fournisseurs(nom)")
      .eq("mama_id", mama_id);
    if (query) {
      q = q.ilike("numero", `%${query}%`);
    }
    q = q.order("date", { ascending: false }).limit(10);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setResults(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  return { results, loading, error, searchFactures };
}
