import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useInventaires() {
  const { mama_id } = useAuth();
  const [inventaires, setInventaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getInventaires() {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventaires")
      .select("*, lignes:inventaire_lignes(*)")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setInventaires(data || []);
    return data || [];
  }

  async function createInventaire(inv) {
    if (!mama_id) return null;
    setLoading(true);
    setError(null);
    const { lignes = [], ...entete } = inv;
    const { data, error } = await supabase
      .from("inventaires")
      .insert([{ ...entete, mama_id }])
      .select()
      .single();
    if (error) {
      setLoading(false);
      setError(error);
      return null;
    }
    if (lignes.length) {
      const toInsert = lignes.map(l => ({ ...l, inventaire_id: data.id, mama_id }));
      const { error: errLines } = await supabase.from("inventaire_lignes").insert(toInsert);
      if (errLines) setError(errLines);
    }
    setLoading(false);
    await getInventaires();
    return data;
  }

  async function getInventaireById(id) {
    if (!mama_id || !id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventaires")
      .select("*, lignes:inventaire_lignes(*)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  async function deleteInventaire(id) {
    if (!mama_id || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaires")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    await getInventaires();
  }

  return {
    inventaires,
    loading,
    error,
    getInventaires,
    createInventaire,
    getInventaireById,
    deleteInventaire,
  };
}
