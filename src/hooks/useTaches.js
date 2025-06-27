import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useTaches() {
  const { mama_id, user_id } = useAuth();
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTaches = useCallback(async (filters = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("taches")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_debut", { ascending: true });
    if (filters.type) query = query.eq("type", filters.type);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setTaches([]);
      return [];
    }
    setTaches(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  const createTache = useCallback(async (values) => {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("taches")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return { error };
    }
    await getTaches();
    return {};
  }, [mama_id, getTaches]);

  const validerTache = useCallback(
    async (id) => {
      if (!id || !user_id) return;
      setLoading(true);
      const { error } = await supabase
        .from("tache_instances")
        .update({ statut: "fait", done_by: user_id })
        .eq("id", id)
        .eq("mama_id", mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return;
      }
      await getTaches();
    },
    [getTaches, user_id, mama_id]
  );

  const generateOccurrences = useCallback(async () => {
    await supabase.rpc("generate_occurrences");
  }, []);

  return { taches, loading, error, getTaches, createTache, validerTache, generateOccurrences };
}
