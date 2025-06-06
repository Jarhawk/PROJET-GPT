// src/hooks/useFichesTechniques.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFichesTechniques() {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFiches = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("fiches_techniques")
        .select("id, nom, cout_total, portions, created_at")
        .eq("mama_id", mama_id)
        .order("nom", { ascending: true });

      if (error) throw error;
      setFiches(data || []);
    } catch (err) {
      console.error("❌ Erreur chargement fiches techniques :", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const addFiche = async (fiche) => {
    if (!mama_id) return { error: "mama_id manquant" };
    const withMama = { ...fiche, mama_id };
    return await supabase.from("fiches_techniques").insert([withMama]);
  };

  const updateFiche = async (id, updates) => {
    return await supabase
      .from("fiches_techniques")
      .update(updates)
      .eq("id", id)
      .eq("mama_id", mama_id);
  };

  const deleteFiche = async (id) => {
    return await supabase
      .from("fiches_techniques")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
  };

  const upsertFiche = async (fiche) => {
    const withMama = { ...fiche, mama_id };
    return await supabase.from("fiches_techniques").upsert([withMama]);
  };

  useEffect(() => {
    if (mama_id) getFiches();
  }, [mama_id]);

  return {
    fiches,
    loading,
    error,
    getFiches,
    addFiche,
    updateFiche,
    deleteFiche,
    upsertFiche,
    refetch: getFiches,
  };
}
