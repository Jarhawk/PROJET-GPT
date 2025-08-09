// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSousFamilles = useCallback(
    async (familleId) => {
      if (!mama_id || !familleId) {
        setSousFamilles([]);
        return [];
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("sous_familles")
        .select("id, nom, famille_id, actif, position")
        .eq("mama_id", mama_id)
        .eq("famille_id", familleId)
        .order("position", { ascending: true });
      if (error) {
        setError(error);
        setSousFamilles([]);
      } else {
        setSousFamilles(Array.isArray(data) ? data : []);
      }
      setLoading(false);
      return data || [];
    },
    [mama_id]
  );

  async function createSousFamille({ famille_id, nom, actif = true, position = 0 }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("sous_familles")
      .insert([{ famille_id, nom, actif, position, mama_id }])
      .select("id, nom, famille_id, actif, position")
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchSousFamilles(famille_id);
    return { data };
  }

  async function updateSousFamille(id, payload) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("sous_familles")
      .update(payload)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchSousFamilles(payload.famille_id || sousFamilles.find(sf => sf.id === id)?.famille_id);
    return { error: null };
  }

  async function deleteSousFamille(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    const { error } = await supabase
      .from("sous_familles")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    return { error };
  }

  async function mergeSousFamilles(srcId, dstId) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("merge_sous_familles", { src: srcId, dst: dstId });
    if (error) setError(error);
    setLoading(false);
    return { error };
  }

  async function reorderSousFamilles(familleId, rows = []) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("reorder_sous_familles", { p_famille: familleId, p_rows: rows });
    if (error) setError(error);
    setLoading(false);
    return { error };
  }

  return {
    sousFamilles,
    loading,
    error,
    fetchSousFamilles,
    createSousFamille,
    updateSousFamille,
    deleteSousFamille,
    mergeSousFamilles,
    reorderSousFamilles,
    setSousFamilles,
  };
}
