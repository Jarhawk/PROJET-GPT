import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useFiches() {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Liste paginée des fiches
  async function getFiches({ search = "", actif = null, page = 1, limit = 20 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("fiches")
      .select("*, lignes:fiche_lignes(id)", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("nom", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    const { data, error, count } = await query;
    setLoading(false);
    if (error) { setError(error); return []; }
    setFiches(Array.isArray(data) ? data : []);
    setTotal(count || 0);
    return data || [];
  }

  // Récupération d'une fiche avec ses lignes + produits
  async function getFicheById(id) {
    if (!id || !mama_id) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from("fiches")
      .select("*, lignes:fiche_lignes(*, product:products(id, nom, unite, pmp))")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) { setError(error); return null; }
    return data;
  }

  // Création fiche + lignes
  async function createFiche({ lignes = [], ...fiche }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fiches")
      .insert([{ ...fiche, mama_id }])
      .select("id")
      .single();
    if (error) { setLoading(false); setError(error); return { error }; }
    const ficheId = data.id;
    if (lignes.length > 0) {
      const toInsert = lignes.map(l => ({ fiche_id: ficheId, product_id: l.product_id, quantite: l.quantite, mama_id }));
      await supabase.from("fiche_lignes").insert(toInsert);
    }
    setLoading(false);
    await getFiches();
    return { data: ficheId };
  }

  // Mise à jour fiche + lignes
  async function updateFiche(id, { lignes = [], ...fiche }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    await supabase.from("fiches").update(fiche).eq("id", id).eq("mama_id", mama_id);
    await supabase.from("fiche_lignes").delete().eq("fiche_id", id);
    if (lignes.length > 0) {
      const toInsert = lignes.map(l => ({ fiche_id: id, product_id: l.product_id, quantite: l.quantite, mama_id }));
      await supabase.from("fiche_lignes").insert(toInsert);
    }
    setLoading(false);
    await getFiches();
  }

  // Désactivation logique
  async function deleteFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    await supabase.from("fiches").update({ actif: false }).eq("id", id).eq("mama_id", mama_id);
    setLoading(false);
    await getFiches();
  }

  function exportFichesToExcel() {
    const datas = (fiches || []).map(f => ({
      id: f.id,
      nom: f.nom,
      portions: f.portions,
      cout_total: f.cout_total,
      cout_par_portion: f.cout_par_portion,
      actif: f.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fiches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fiches_mamastock.xlsx");
  }

  return { fiches, total, loading, error, getFiches, getFicheById, createFiche, updateFiche, deleteFiche, exportFichesToExcel };
}
