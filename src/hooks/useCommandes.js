// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useCommandes() {
  const { mama_id } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getCommandes({ fournisseur = "", statut = "", page = 1, pageSize = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("commandes")
      .select("id, date_commande, statut, actif, fournisseur:fournisseurs(id, nom), lignes:commande_lignes(id)", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date_commande", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (fournisseur) q = q.eq("fournisseur_id", fournisseur);
    if (statut) q = q.eq("statut", statut);
    const { data, error, count } = await q;
    if (!error) {
      setCommandes(Array.isArray(data) ? data : []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function insertCommande(cmd) {
    if (!mama_id) return { error: "no mama_id" };
    const { lignes = [], ...header } = cmd || {};
    setLoading(true);
    const { data, error } = await supabase
      .from("commandes")
      .insert([{ ...header, mama_id }])
      .select("id")
      .single();
    if (!error && data?.id && lignes.length) {
      const rows = lignes.map(l => ({ ...l, commande_id: data.id, mama_id }));
      await supabase.from("commande_lignes").insert(rows);
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function updateCommande(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    const { data, error } = await supabase
      .from("commandes")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    if (error) setError(error);
    return { data, error };
  }

  async function toggleCommandeActif(id, actif) {
    return updateCommande(id, { actif });
  }

  return {
    commandes,
    total,
    loading,
    error,
    getCommandes,
    insertCommande,
    updateCommande,
    toggleCommandeActif,
  };
}

export default useCommandes;
