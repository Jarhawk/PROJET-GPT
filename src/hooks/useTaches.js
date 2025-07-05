// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
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
      .order("date_echeance", { ascending: true });
    if (filters.statut) query = query.eq("statut", filters.statut);
    if (filters.priorite) query = query.eq("priorite", filters.priorite);
    if (filters.assigne) query = query.contains("assignes", [filters.assigne]);
    if (filters.start) query = query.gte("date_debut", filters.start);
    if (filters.end) query = query.lte("date_echeance", filters.end);
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

  const computeDue = values => {
    if (values.delai_jours && !values.date_echeance) {
      const start = new Date(values.date_debut);
      if (!Number.isNaN(start)) {
        start.setDate(start.getDate() + Number(values.delai_jours));
        return start.toISOString().slice(0, 10);
      }
    }
    return values.date_echeance;
  };

  const createTache = useCallback(
    async values => {
      if (!mama_id || !user_id) return { error: "no_mama" };
      setLoading(true);
      setError(null);
      const payload = {
        ...values,
        date_echeance: computeDue(values),
        mama_id,
        created_by: user_id,
      };
      const { error } = await supabase.from("taches").insert([payload]);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      await getTaches();
      return {};
    },
    [mama_id, user_id, getTaches]
  );

  const updateTache = useCallback(
    async (id, values) => {
      setLoading(true);
      setError(null);
      const payload = { ...values, date_echeance: computeDue(values), updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from("taches")
        .update(payload)
        .eq("id", id)
        .eq("mama_id", mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      await getTaches();
      return {};
    },
    [mama_id, getTaches]
  );

  const deleteTache = useCallback(
    async id => {
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from("taches")
        .delete()
        .eq("id", id)
        .eq("mama_id", mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      await getTaches();
      return {};
    },
    [mama_id, getTaches]
  );

  return {
    taches,
    loading,
    error,
    getTaches,
    createTache,
    updateTache,
    deleteTache,
  };
}
