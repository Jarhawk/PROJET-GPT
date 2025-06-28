import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useInvoiceLines } from "./useInvoiceLines";

export function useFactures() {
  const { mama_id } = useAuth();
  const {
    addLine,
    updateLine,
    deleteLine,
    fetchLines,
  } = useInvoiceLines();
  const [factures, setFactures] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getFactures({
    search = "",
    fournisseur = "",
    statut = "",
    mois = "",
    page = 1,
    pageSize = 20,
  } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("factures")
      .select("*, fournisseur:fournisseurs(id, nom)", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) query = query.ilike("reference", `%${search}%`);
    if (fournisseur) query = query.eq("fournisseur_id", fournisseur);
    if (statut) query = query.eq("statut", statut);
    if (mois) {
      const start = `${mois}-01`;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const endStr = end.toISOString().slice(0, 10);
      query = query.gte("date", start).lt("date", endStr);
    }

    const { data, error, count } = await query;
    if (!error) {
      setFactures(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function fetchFactureById(id) {
    if (!id || !mama_id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("factures")
      .select("*, fournisseur:fournisseurs(id, nom)")
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

  async function createFacture(data) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const { data: inserted, error } = await supabase
      .from("factures")
      .insert([{ ...data, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures(f => [inserted, ...f]);
    return { data: inserted };
  }

  async function updateFacture(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const { data: updated, error } = await supabase
      .from("factures")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures(f => f.map(ft => (ft.id === id ? updated : ft)));
    return { data: updated };
  }

  async function deleteFacture(id) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const { count } = await supabase
      .from("facture_lignes")
      .select("id", { count: "exact", head: true })
      .eq("facture_id", id)
      .eq("mama_id", mama_id);
    if (count > 0) {
      setLoading(false);
      const msg = "Lignes de facture existantes";
      setError(msg);
      console.error(msg);
      return { error: msg };
    }
    const { error } = await supabase
      .from("factures")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures(f => f.filter(ft => ft.id !== id));
    return { success: true };
  }

  async function addLigneFacture(facture_id, ligne) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const {
      fournisseur_id,
      product_id,
      quantite,
      prix_unitaire,
      tva,
      date,
    } = ligne || {};
    const { data: inserted, error } = await addLine(facture_id, {
      product_id,
      quantite,
      prix_unitaire,
      tva,
    });
    if (!error && product_id && fournisseur_id) {
      await supabase
        .from("supplier_products")
        .upsert(
          {
            product_id,
            fournisseur_id,
            prix_achat: prix_unitaire,
            date_livraison: date || new Date().toISOString().slice(0, 10),
            mama_id,
          },
          { onConflict: ["product_id", "fournisseur_id", "date_livraison"] }
        );
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data: inserted };
  }

  async function calculateTotals(facture_id) {
    if (!mama_id) return { ht: 0, tva: 0, ttc: 0 };
    const lignes = await fetchLines(facture_id);
    const ht = (lignes || []).reduce((s,l) => s + l.quantite * l.prix_unitaire, 0);
    const tva = (lignes || []).reduce((s,l) => s + l.quantite * l.prix_unitaire * (l.tva || 0) / 100, 0);
    const ttc = ht + tva;
    await supabase
      .from("factures")
      .update({ total_ht: ht, total_tva: tva, total_ttc: ttc })
      .eq("id", facture_id)
      .eq("mama_id", mama_id);
    return { ht, tva, ttc };
  }

  return {
    factures,
    total,
    loading,
    error,
    getFactures,
    fetchFactureById,
    createFacture,
    updateFacture,
    deleteFacture,
    addLigneFacture,
    calculateTotals,
    updateLine,
    deleteLine,
  };
}
