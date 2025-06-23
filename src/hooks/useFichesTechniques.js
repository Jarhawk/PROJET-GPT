import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFichesTechniques() {
  const { mama_id } = useAuth();
  const [fichesTechniques, setFichesTechniques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchFichesTechniques() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("fiches_techniques")
        .select("*")
        .eq("mama_id", mama_id)
        .order("nom", { ascending: true });

      if (error) throw error;
      setFichesTechniques(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erreur chargement fiches techniques.");
      setFichesTechniques([]);
    } finally {
      setLoading(false);
    }
  }

  async function addFicheTechnique(ft) {
    const { error } = await supabase
      .from("fiches_techniques")
      .insert([{ ...ft, mama_id }]);
    if (error) throw error;
    await fetchFichesTechniques();
  }

  async function updateFicheTechnique(id, updateFields) {
    const { error } = await supabase
      .from("fiches_techniques")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) throw error;
    await fetchFichesTechniques();
  }

  async function deleteFicheTechnique(id) {
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) throw error;
    await fetchFichesTechniques();
  }

  return {
    fichesTechniques,
    loading,
    error,
    fetchFichesTechniques,
    addFicheTechnique,
    updateFicheTechnique,
    deleteFicheTechnique,
  };
}
