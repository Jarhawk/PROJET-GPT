// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function useTaches() {
  const { mama_id, user_id } = useAuth();
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTaches = useCallback(async (filters = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("v_taches_assignees")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_echeance", { ascending: true });
    if (filters.statut) query = query.eq("statut", filters.statut);
    if (filters.utilisateur) query = query.eq("utilisateur_id", filters.utilisateur);
    if (filters.start) query = query.gte("date_echeance", filters.start);
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

  const fetchTache = useCallback(
    async id => {
      if (!mama_id || !id) return null;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("v_taches_assignees")
        .select("*")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  const assignerUtilisateurs = useCallback(async (tacheId, userIds = []) => {
    if (!tacheId || !Array.isArray(userIds) || userIds.length === 0) return {};
    const rows = userIds.map(uid => ({ tache_id: tacheId, utilisateur_id: uid }));
    const { error } = await supabase.from("utilisateurs_taches").insert(rows);
    if (error) {
      setError(error.message || error);
      return { error };
    }
    return {};
  }, []);

  const createTache = useCallback(
    async values => {
      if (!mama_id || !user_id) return { error: "no_mama" };
      setLoading(true);
      setError(null);
      const payload = {
        titre: values.titre,
        description: values.description,
        priorite: values.priorite,
        statut: values.statut || "a_faire",
        date_echeance: values.date_echeance,
        mama_id,
      };
      const { data, error } = await supabase
        .from("taches")
        .insert([payload])
        .select()
        .single();
      if (error) {
        setLoading(false);
        setError(error.message || error);
        return { error };
      }
      const assignes =
        values.assignes && values.assignes.length > 0 ? values.assignes : [user_id];
      await assignerUtilisateurs(data.id, assignes);
      setLoading(false);
      await fetchTaches();
      return data;
    },
    [mama_id, user_id, assignerUtilisateurs, fetchTaches]
  );

  const updateTache = useCallback(
    async (id, values) => {
      setLoading(true);
      setError(null);
      const payload = {
        titre: values.titre,
        description: values.description,
        priorite: values.priorite,
        statut: values.statut,
        date_echeance: values.date_echeance,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("taches")
        .update(payload)
        .eq("id", id)
        .eq("mama_id", mama_id);
      if (error) {
        setLoading(false);
        setError(error.message || error);
        return { error };
      }
      if (values.assignes) {
        await supabase.from("utilisateurs_taches").delete().eq("tache_id", id);
        await assignerUtilisateurs(id, values.assignes);
      }
      setLoading(false);
      await fetchTaches();
      return {};
    },
    [mama_id, assignerUtilisateurs, fetchTaches]
  );

  const deleteTache = useCallback(
    async id => {
      setLoading(true);
      setError(null);
      await supabase.from("utilisateurs_taches").delete().eq("tache_id", id);
      let { error } = await supabase
        .from("taches")
        .update({ actif: false })
        .eq("id", id)
        .eq("mama_id", mama_id);
      if (error) {
        const del = await supabase
          .from("taches")
          .delete()
          .eq("id", id)
          .eq("mama_id", mama_id);
        error = del.error;
      }
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      await fetchTaches();
      return {};
    },
    [mama_id, fetchTaches]
  );

  return {
    taches,
    loading,
    error,
    fetchTaches,
    fetchTache,
    createTache,
    updateTache,
    deleteTache,
    assignerUtilisateurs,
  };
}

export default useTaches;
