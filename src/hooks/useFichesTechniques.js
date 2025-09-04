// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
      console.error('fetchFichesTechniques error:', err);
      setError(err.message || "Erreur chargement fiches techniques.");
      setFichesTechniques([]);
    } finally {
      setLoading(false);
    }
  }

  async function addFicheTechnique(ft) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fiches_techniques")
      .insert([{ ...ft, mama_id }])
      .select("id")
      .single();
    if (error) {
      console.error('addFicheTechnique error:', error);
      setLoading(false);
      setError(error);
      return { error };
    }
    const fiche = { ...ft, id: data?.id };
    setFichesTechniques(prev => [...prev, fiche]);
    setLoading(false);
    return { data: fiche.id };
  }

  async function updateFicheTechnique(id, updateFields) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fiches_techniques")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) {
      console.error('updateFicheTechnique error:', error);
      setLoading(false);
      setError(error);
      return { error };
    }
    setFichesTechniques(prev => prev.map(f => f.id === id ? { ...f, ...updateFields } : f));
    setLoading(false);
    return { data: id };
  }

  async function deleteFicheTechnique(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) {
      console.error('deleteFicheTechnique error:', error);
      setLoading(false);
      setError(error);
      return { error };
    }
    setFichesTechniques(prev => prev.filter(f => f.id !== id));
    setLoading(false);
    return { data: id };
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
