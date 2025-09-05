// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// fix: avoid ilike.%% on empty search.
import supabase from '@/lib/supabase';
import { useState } from "react";
import { applyRange } from '@/lib/supa/applyRange';

import { useAuth } from '@/hooks/useAuth';
import usePeriodes from "@/hooks/usePeriodes";
import { normalizeSearchTerm } from '@/lib/supa/textSearch';

export function useFactures() {
  const { mama_id } = useAuth();
  const { checkCurrentPeriode } = usePeriodes();
  const [factures, setFactures] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getBonsLivraison({ search = "", page = 1, limit = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("bons_livraison")
      .select(
        "id, numero_bl, date_reception, actif, fournisseur_id, mama_id, created_at, lignes:lignes_bl!bl_id(id)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("date_reception", { ascending: false });
    const termBL = normalizeSearchTerm(search);
    if (termBL) q = q.ilike("numero_bl", `%${termBL}%`);
    const { data, error, count } = await applyRange(
      q,
      (page - 1) * limit,
      limit
    );
    if (!error) {
      setFactures(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function getFactures({
    search = "",
    fournisseur = "",
    statut = "",
    mois = "",
    page = 1,
    pageSize = 20
  } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("factures")
      .select(
        "id, numero, date_facture, montant, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!factures_fournisseur_id_fkey(id, nom)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("date_facture", { ascending: false });

    const term = normalizeSearchTerm(search);
    if (term) {
      query = query.or(
        `numero.ilike.%${term}%,fournisseurs.nom.ilike.%${term}%`
      );
    }
    if (fournisseur) query = query.eq("fournisseur_id", fournisseur);
    if (statut) query = query.eq("statut", statut);
    if (mois) {
      const start = `${mois}-01`;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const endStr = end.toISOString().slice(0, 10);
      query = query.gte("date_facture", start).lt("date_facture", endStr);
    }

    const { data, error, count } = await applyRange(
      query,
      (page - 1) * pageSize,
      pageSize
    );
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
      .select(
        "id, numero, date_facture, montant, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!factures_fournisseur_id_fkey(id, nom)"
      )
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
    const { error: pErr } = await checkCurrentPeriode(data.date_facture);
    if (pErr) return { error: pErr };
    setLoading(true);
    setError(null);
    const { data: inserted, error } = await supabase.
    from("factures").
    insert([{ ...data, mama_id }]).
    select().
    single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures((f) => [inserted, ...f]);
    return { data: inserted };
  }

  async function updateFacture(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    if (fields.date_facture) {
      const { error: pErr } = await checkCurrentPeriode(fields.date_facture);
      if (pErr) return { error: pErr };
    }
    setLoading(true);
    setError(null);
    const { data: updated, error } = await supabase.
    from("factures").
    update(fields).
    eq("id", id).
    eq("mama_id", mama_id).
    select().
    single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures((f) => f.map((ft) => ft.id === id ? updated : ft));
    return { data: updated };
  }

  async function deleteFacture(id) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
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
    setFactures((f) => f.filter((ft) => ft.id !== id));
    return { success: true };
  }

  async function addLigneFacture(facture_id, ligne) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const {
      fournisseur_id,
      produit_id,
      quantite,
      prix_unitaire,
      tva,
      zone_stock_id,
      unite_id,
      date
    } = ligne || {};
    const { data: inserted, error } = await supabase.
    from("facture_lignes").
    insert([
    {
      produit_id,
      quantite,
      prix_unitaire,
      tva,
      zone_stock_id,
      unite_id,
      total: quantite * (prix_unitaire || 0),
      facture_id,
      mama_id
    }]
    ).
    select().
    single();
    if (!error && produit_id && fournisseur_id) {
      await supabase.
      from("fournisseur_produits").
      upsert(
        {
          produit_id,
          fournisseur_id,
          prix_achat: prix_unitaire,
          date_livraison: date || new Date().toISOString().slice(0, 10),
          mama_id
        },
        { onConflict: ["produit_id", "fournisseur_id", "date_livraison"] }
      );
      await supabase.
      from("achats").
      insert([
      {
        produit_id,
        fournisseur_id,
        mama_id,
        prix: prix_unitaire,
        quantite,
        date_achat: date || new Date().toISOString().slice(0, 10)
      }]
      );
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data: inserted };
  }

  async function createBonLivraison(bl) {
    if (!mama_id) return { error: "no mama_id" };
    const { lignes, ...entete } = bl || {};
    setLoading(true);
    const { data, error } = await supabase.
    from("bons_livraison").
    insert([{ ...entete, mama_id }]).
    select("id").
    single();
    if (!error && data?.id && Array.isArray(lignes) && lignes.length) {
      const rows = lignes.map((l) => ({ ...l, bl_id: data.id, mama_id }));
      await supabase.from("lignes_bl").insert(rows);
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function updateStock(id, type) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    const table = type === "facture" ? "factures" : "bons_livraison";
    const { error } = await supabase.rpc("apply_stock_from_achat", {
      achat_id: id,
      achat_table: table,
      mama_id
    });
    setLoading(false);
    if (error) setError(error);
    return { error };
  }

  async function toggleFactureActive(id, actif) {
    return { error: null };
  }

  async function calculateTotals(facture_id) {
    if (!mama_id) return { ht: 0, tva: 0, ttc: 0 };
    const { data: lignes } = await supabase.
    from("facture_lignes").
    select("quantite, prix_unitaire, tva").
    eq("facture_id", facture_id).
    eq("mama_id", mama_id);
    const ht = (lignes || []).reduce((s, l) => s + l.quantite * (l.prix_unitaire || 0), 0);
    const tva = (lignes || []).reduce((s, l) => s + l.quantite * (l.prix_unitaire || 0) * (l.tva || 0) / 100, 0);
    const ttc = ht + tva;
    await supabase.
    from("factures").
    update({ total_ht: ht, total_tva: tva, total_ttc: ttc, montant_total: ttc }).
    eq("id", facture_id).
    eq("mama_id", mama_id);
    return { ht, tva, ttc };
  }

  return {
    factures,
    total,
    loading,
    error,
    getBonsLivraison,
    getFactures,
    fetchFactureById,
    createFacture,
    createBonLivraison,
    updateFacture,
    deleteFacture,
    addLigneFacture,
    updateStock,
    toggleFactureActive,
    calculateTotals
  };
}