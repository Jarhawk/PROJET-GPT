// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useInventaireLignes() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function checkInventaire(inventaire_id) {
    const { data } = await supabase
      .from("inventaires")
      .select("id")
      .eq("id", inventaire_id)
      .eq("mama_id", mama_id)
      .maybeSingle();
    return !!data;
  }

  async function fetchLignes({
    inventaireId,
    page = 1,
    limit = 30,
    search = "",
    sort = "created_at",
    ascending = false,
    includeArchives = false,
  } = {}) {
    if (!mama_id || !inventaireId) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("produits_inventaire")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .eq("inventaire_id", inventaireId)
      .order(sort, { ascending });
    if (!includeArchives) query = query.eq("actif", true);
    if (search) {
      query = query.eq("produit_id", search);
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

  async function createLigne({ inventaire_id, produit_id, quantite_reelle }) {
    if (!mama_id || !inventaire_id || !produit_id) {
      throw new Error("missing reference");
    }
    if (!(await checkInventaire(inventaire_id))) {
      console.warn("inventaire_id invalid or not owned", inventaire_id);
      throw new Error("invalid reference");
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("produits_inventaire")
      .insert([{ inventaire_id, produit_id, quantite_reelle, mama_id }])
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
    if (values?.inventaire_id && !(await checkInventaire(values.inventaire_id))) {
      console.warn("inventaire_id invalid or not owned", values.inventaire_id);
      throw new Error("invalid reference");
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("produits_inventaire")
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
      .from("produits_inventaire")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
  }

  async function getLigne(id) {
    if (!mama_id || !id) return null;
    const { data, error } = await supabase
      .from("produits_inventaire")
      .select("*")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  return { fetchLignes, createLigne, updateLigne, deleteLigne, getLigne, loading, error };
}
