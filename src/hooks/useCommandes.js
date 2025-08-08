// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useCommandes() {
  const { mama_id, user_id } = useAuth();
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommandes = useCallback(
    async ({ fournisseur = "", statut = "", debut = "", fin = "", page = 1, limit = 20 } = {}) => {
      if (!mama_id) return { data: [], count: 0 };
      setLoading(true);
      setError(null);
      let query = supabase
        .from("commandes")
        .select(
          "*, fournisseur:fournisseur_id(id, nom, email), lignes:commande_lignes(total_ligne)",
          { count: "exact" }
        )
        .eq("mama_id", mama_id)
        .order("date_commande", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (fournisseur) query = query.eq("fournisseur_id", fournisseur);
      if (statut) query = query.eq("statut", statut);
      if (debut) query = query.gte("date_commande", debut);
      if (fin) query = query.lte("date_commande", fin);
      const { data, count, error } = await query;
      setLoading(false);
      if (error) {
        console.error("❌ fetchCommandes", error.message);
        setError(error);
        setData([]);
        setCount(0);
        return { data: [], count: 0 };
      }
      const rows = (data || []).map((c) => ({
        ...c,
        total: (c.lignes || []).reduce((s, l) => s + Number(l.total_ligne || 0), 0),
      }));
      setData(rows);
      setCount(count || 0);
      return { data: rows, count: count || 0 };
    },
    [mama_id]
  );

  const fetchCommandeById = useCallback(
    async (id) => {
      if (!id || !mama_id) return { data: null, error: null };
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("commandes")
        .select(
          "*, fournisseur:fournisseur_id(id, nom, email), lignes:commande_lignes(*, produit:produit_id(id, nom))"
        )
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      setLoading(false);
      if (error) {
        console.error("❌ fetchCommandeById", error.message);
        setError(error);
        setCurrent(null);
        return { data: null, error };
      }
      setCurrent(data);
      return { data, error: null };
    },
    [mama_id]
  );

  async function createCommande({ lignes = [], ...rest }) {
    if (!mama_id) return { error: "mama_id manquant" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("commandes")
      .insert([{ ...rest, mama_id, created_by: user_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      console.error("❌ createCommande", error.message);
      setError(error);
      return { error };
    }
    if (lignes.length) {
      const toInsert = lignes.map((l) => ({ ...l, commande_id: data.id }));
      const { error: lineErr } = await supabase.from("commande_lignes").insert(toInsert);
      if (lineErr) console.error("❌ commande lignes", lineErr.message);
    }
    return { data };
  }

  async function updateCommande(id, fields) {
    if (!mama_id) return { error: "mama_id manquant" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("commandes")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      console.error("❌ updateCommande", error.message);
      setError(error);
      return { error };
    }
    return { data };
  }

  async function validateCommande(id) {
    return updateCommande(id, {
      statut: "validée",
      validated_by: user_id,
      envoyee_at: new Date().toISOString(),
    });
  }

  async function deleteCommande(id) {
    if (!mama_id) return { error: "mama_id manquant" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("commandes")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      console.error("❌ deleteCommande", error.message);
      setError(error);
      return { error };
    }
    return { data: true };
  }

  return {
    data,
    commandes: data,
    currentCommande: current,
    count,
    loading,
    error,
    fetchCommandes,
    fetchCommandeById,
    createCommande,
    updateCommande,
    validateCommande,
    deleteCommande,
  };
}

export default useCommandes;
