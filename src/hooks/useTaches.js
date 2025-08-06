// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

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
      .select(
        "*, utilisateurs_taches(utilisateur_id, utilisateur:utilisateurs(nom))"
      )
      .eq("mama_id", mama_id)
      .order("date_echeance", { ascending: true });
    if (filters.statut) query = query.eq("statut", filters.statut);
    if (filters.priorite) query = query.eq("priorite", filters.priorite);
    if (filters.assigne)
      query = query.eq("utilisateurs_taches.utilisateur_id", filters.assigne);
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

  const getTache = useCallback(async id => {
    if (!mama_id || !id) return null;
    const { data, error } = await supabase
      .from("taches")
      .select(
        "*, utilisateurs_taches(utilisateur_id, utilisateur:utilisateurs(nom))"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setError(error.message || error);
      return null;
    }
    return data;
  }, [mama_id]);

  const createTache = useCallback(async values => {
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
    const assignes = values.assignes && values.assignes.length > 0 ? values.assignes : [user_id];
    const rows = assignes.map(uid => ({ tache_id: data.id, utilisateur_id: uid }));
    await supabase.from("utilisateurs_taches").insert(rows);
    setLoading(false);
    await getTaches();
    return data;
  }, [mama_id, user_id, getTaches]);

  const updateTache = useCallback(async (id, values) => {
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
    await supabase
      .from("utilisateurs_taches")
      .delete()
      .eq("tache_id", id);
    const assignes = values.assignes && values.assignes.length > 0 ? values.assignes : [user_id];
    const rows = assignes.map(uid => ({ tache_id: id, utilisateur_id: uid }));
    await supabase.from("utilisateurs_taches").insert(rows);
    setLoading(false);
    await getTaches();
    return {};
  }, [mama_id, user_id, getTaches]);

  const deleteTache = useCallback(async id => {
    setLoading(true);
    setError(null);
    await supabase.from("utilisateurs_taches").delete().eq("tache_id", id);
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
  }, [mama_id, getTaches]);

  return {
    taches,
    loading,
    error,
    getTaches,
    getTache,
    createTache,
    updateTache,
    deleteTache,
  };
}

export default useTaches;
