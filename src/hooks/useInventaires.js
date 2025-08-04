// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useInventaires() {
  const { mama_id } = useAuth();
  const [inventaires, setInventaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getInventaires({ includeArchives = false } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("inventaires")
      .select(
        "*, lignes:inventaire_lignes!inventaire_id(*, produit:produits!inventaire_lignes_produit_id_fkey(id, nom, unite_id, unites:unite_id (nom), stock_theorique, pmp))"
      )
      .eq("mama_id", mama_id);
    if (!includeArchives) query = query.eq("actif", true);
    const { data, error } = await query.order("date_inventaire", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    const cleaned = (data || []).map(inv => ({
      ...inv,
      lignes: (inv.lignes || []).filter(l => l.actif !== false),
    }));
    setInventaires(cleaned);
    return cleaned;
  }

  async function fetchMouvementsInventaire(inventaireId) {
    if (!mama_id || !inventaireId) return [];
    const { data, error } = await supabase
      .from("stock_mouvements")
      .select("*")
      .eq("inventaire_id", inventaireId)
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: true });
    if (error) {
      setError(error);
      return [];
    }
    return data || [];
  }

  async function validateInventaireStock(inventaireId) {
    if (!mama_id || !inventaireId) return false;
    const inv = await getInventaireById(inventaireId);
    if (!inv) return false;
    for (const line of inv.lignes || []) {
      const { data, error } = await supabase
        .from("produits")
        .select("stock_reel")
        .eq("id", line.produit_id)
        .eq("mama_id", mama_id)
        .single();
      if (error || !data) return false;
      if (Number(data.stock_reel) !== Number(line.quantite)) return false;
    }
    return true;
  }

  async function createInventaire(inv) {
    if (!mama_id) return null;
    setLoading(true);
    setError(null);
    const { lignes = [], date, ...entete } = inv;
    const { data, error } = await supabase
      .from("inventaires")
      .insert([{ ...entete, date_inventaire: date, mama_id }])
      .select()
      .single();
    if (error) {
      setLoading(false);
      setError(error);
      return null;
    }
    if (lignes.length) {
      const toInsert = lignes.map(l => ({
        ...l,
        produit_id: l.produit_id,
        inventaire_id: data.id,
        mama_id,
      }));
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
      .select(
        "*, lignes:inventaire_lignes!inventaire_id(*, produit:produits!inventaire_lignes_produit_id_fkey(id, nom, unite_id, unites:unite_id (nom), stock_theorique, pmp))"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return null;
    }
    const inv = data
      ? { ...data, lignes: (data.lignes || []).filter(l => l.actif !== false) }
      : null;
    return inv;
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

  async function reactivateInventaire(id) {
    if (!mama_id || !id) return;
    const { error } = await supabase
      .from("inventaires")
      .update({ actif: true })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (!error) await getInventaires();
  }

  return {
    inventaires,
    loading,
    error,
    getInventaires,
    createInventaire,
    getInventaireById,
    deleteInventaire,
    reactivateInventaire,
    fetchMouvementsInventaire,
    validateInventaireStock,
  };
}
