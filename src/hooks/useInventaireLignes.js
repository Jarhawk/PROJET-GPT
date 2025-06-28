import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useInventaireLignes() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLignes({
    inventaireId,
    page = 1,
    limit = 30,
    search = "",
    sort = "created_at",
    ascending = false,
  } = {}) {
    if (!mama_id || !inventaireId) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("inventaire_lignes")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .eq("inventaire_id", inventaireId)
      .order(sort, { ascending });
    if (search) {
      query = query.eq("product_id", search);
    }
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
    const { data, error, count } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    return { data: data || [], count: count || 0 };
  }

  async function createLigne({ inventaire_id, product_id, quantite }) {
    if (!mama_id || !inventaire_id || !product_id) {
      throw new Error("missing reference");
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventaire_lignes")
      .insert([{ inventaire_id, product_id, quantite, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  async function updateLigne(id, values) {
    if (!mama_id || !id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventaire_lignes")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  async function deleteLigne(id) {
    if (!mama_id || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaire_lignes")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
  }

  return { fetchLignes, createLigne, updateLigne, deleteLigne, loading, error };
}
