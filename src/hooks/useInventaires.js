// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import usePeriodes from "@/hooks/usePeriodes";

export function useInventaires() {
  const { mama_id } = useAuth();
  const { checkCurrentPeriode } = usePeriodes();
  const [inventaires, setInventaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mama_id) return;
    void getInventaires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mama_id]);

  async function getInventaires({
    zoneId,
    periodeId,
    statut,
    includeArchives = false,
  } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("inventaires")
      .select(
        "*, zone:inventaire_zones!inventaires_zone_id_fkey(nom), lignes:produits_inventaire!inventaire_id(*, produit:produits!produits_inventaire_produit_id_fkey(id, nom, unite_id, unite:unite_id (nom), pmp))"
      )
      .eq("mama_id", mama_id);
    if (zoneId) query = query.eq("zone_id", zoneId);
    if (periodeId) query = query.eq("periode_id", periodeId);
    if (statut) query = query.eq("statut", statut);
    if (!includeArchives) query = query.eq("actif", true);
    const { data, error } = await query.order("date_inventaire", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    const cleaned = (data || []).map(inv => ({
      ...inv,
      zone: inv.zone?.nom || null,
      lignes: (inv.lignes || []).filter(l => l.actif !== false),
    }));
    setInventaires(cleaned);
    return cleaned;
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
      if (Number(data.stock_reel) !== Number(line.quantite_reelle)) return false;
    }
    return true;
  }

  async function createInventaire(inv) {
    if (!mama_id) return null;
    const { lignes = [], date, ...entete } = inv;
    const { data: periode, error: pErr } = await checkCurrentPeriode(date);
    if (pErr) {
      setError(pErr);
      return null;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventaires")
      .insert([{ ...entete, date_inventaire: date, periode_id: periode.id, mama_id }])
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
        quantite_reelle: l.quantite_reelle,
        inventaire_id: data.id,
        mama_id,
      }));
      const { error: errLines } = await supabase.from("produits_inventaire").insert(toInsert);
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
          "*, zone:inventaire_zones!inventaires_zone_id_fkey(nom), lignes:produits_inventaire!inventaire_id(*, produit:produits!produits_inventaire_produit_id_fkey(id, nom, unite_id, unite:unite_id (nom), pmp))"
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
      ? {
          ...data,
          zone: data.zone?.nom || null,
          lignes: (data.lignes || []).filter(l => l.actif !== false),
        }
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
    validateInventaireStock,
  };
}
