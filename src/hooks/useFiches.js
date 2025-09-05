// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState } from "react";

import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSPDF from "jspdf";
import "jspdf-autotable";

export function useFiches() {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Liste paginée des fiches techniques
  async function getFiches({ search = "", actif = null, famille = null, page = 1, limit = 20, sortBy = "nom", asc = true } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const sortField = ["nom", "cout_par_portion"].includes(sortBy) ? sortBy : "nom";
    let query = supabase.
    from("fiches_techniques").
    select(
      "*, famille:famille_id(id, nom), lignes:fiche_lignes!fiche_id(id)",
      { count: "exact" }
    ).
    eq("mama_id", mama_id).
    order(sortField, { ascending: asc }).
    range((page - 1) * limit, page * limit - 1);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    if (famille) query = query.eq("famille_id", famille);
    const { data, error, count } = await query;
    setLoading(false);
    if (error) {
      console.error('getFiches error:', error);
      setError(error);
      return [];
    }
    setFiches(Array.isArray(data) ? data : []);
    setTotal(count || 0);
    return data || [];
  }

  // Récupération d'une fiche avec ses lignes + produits
  async function getFicheById(id) {
    if (!id || !mama_id) return null;
    setLoading(true);
    const { data, error } = await supabase.
    from("fiches_techniques").
    select(
      "*, famille:famille_id(id, nom), lignes:v_fiche_lignes_complete!fiche_id(*, sous_fiche:sous_fiche_id(id, nom, cout_par_portion))"
    ).
    eq("id", id).
    eq("mama_id", mama_id).
    single();
    setLoading(false);
    if (error) {
      console.error('getFicheById error:', error);
      setError(error);
      return null;
    }
    return data;
  }

  // Création fiche + lignes
  async function createFiche({ lignes = [], ...fiche }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data, error: insertError } = await supabase.
    from("fiches_techniques").
    insert([{ ...fiche, mama_id }]).
    select("id").
    single();
    if (insertError) {
      console.error('createFiche error:', insertError);
      setLoading(false);
      setError(insertError);
      return { error: insertError };
    }
    const ficheId = data?.id ?? data?.[0]?.id;
    if (lignes.length > 0) {
      const toInsert = lignes.map((l) => ({
        fiche_id: ficheId,
        produit_id: l.produit_id || null,
        sous_fiche_id: l.sous_fiche_id || null,
        quantite: l.quantite,
        mama_id
      }));
      const { error: lignesError } = await supabase.from("fiche_lignes").insert(toInsert);
      if (lignesError) {
        console.error('createFiche lignes error:', lignesError);
        setLoading(false);
        setError(lignesError);
        return { error: lignesError };
      }
    }
    setFiches((prev) => [{ id: ficheId, ...fiche }, ...prev]);
    setTotal((prev) => prev + 1);
    setLoading(false);
    return { data: ficheId };
  }

  // Mise à jour fiche + lignes
  async function updateFiche(id, { lignes = [], ...fiche }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase.
    from("fiches_techniques").
    update(fiche).
    eq("id", id).
    eq("mama_id", mama_id);
    if (updateError) {
      console.error('updateFiche error:', updateError);
      setLoading(false);
      setError(updateError);
      return { error: updateError };
    }
    const { error: deleteError } = await supabase.
    from("fiche_lignes").
    delete().
    eq("fiche_id", id).
    eq("mama_id", mama_id);
    if (deleteError) {
      console.error('updateFiche delete lines error:', deleteError);
      setLoading(false);
      setError(deleteError);
      return { error: deleteError };
    }
    if (lignes.length > 0) {
      const toInsert = lignes.map((l) => ({
        fiche_id: id,
        produit_id: l.produit_id || null,
        sous_fiche_id: l.sous_fiche_id || null,
        quantite: l.quantite,
        mama_id
      }));
      const { error: insertError } = await supabase.from("fiche_lignes").insert(toInsert);
      if (insertError) {
        console.error('updateFiche lines insert error:', insertError);
        setLoading(false);
        setError(insertError);
        return { error: insertError };
      }
    }
    setFiches((prev) => prev.map((f) => f.id === id ? { ...f, ...fiche } : f));
    setLoading(false);
    return { data: id };
  }

  // Désactivation logique
  async function deleteFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase.
    from("fiches_techniques").
    update({ actif: false }).
    eq("id", id).
    eq("mama_id", mama_id);
    if (deleteError) {
      console.error('deleteFiche error:', deleteError);
      setLoading(false);
      setError(deleteError);
      return { error: deleteError };
    }
    setFiches((prev) => prev.filter((f) => f.id !== id));
    setTotal((prev) => Math.max(prev - 1, 0));
    setLoading(false);
    return { data: id };
  }

  async function duplicateFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data: fiche, error: fetchError } = await supabase.
    from("fiches_techniques").
    select("*, lignes:fiche_lignes!fiche_id(*)").
    eq("id", id).
    eq("mama_id", mama_id).
    single();
    if (fetchError) {
      console.error('duplicateFiche fetch error:', fetchError);
      setLoading(false);
      setError(fetchError);
      return { error: fetchError };
    }
    const { lignes = [], ...rest } = fiche || {};
    const { data: inserted, error: insertError } = await supabase.
    from("fiches_techniques").
    insert([{ ...rest, nom: `${rest.nom} (copie)`, mama_id }]).
    select("id").
    single();
    if (insertError) {
      console.error('duplicateFiche insert error:', insertError);
      setLoading(false);
      setError(insertError);
      return { error: insertError };
    }
    const newId = inserted.id;
    if (lignes.length) {
      const toInsert = lignes.map((l) => ({
        fiche_id: newId,
        produit_id: l.produit_id || null,
        sous_fiche_id: l.sous_fiche_id || null,
        quantite: l.quantite,
        mama_id
      }));
      const { error: lineErr } = await supabase.from("fiche_lignes").insert(toInsert);
      if (lineErr) {
        console.error('duplicateFiche lines insert error:', lineErr);
        setLoading(false);
        setError(lineErr);
        return { error: lineErr };
      }
    }
    setFiches((prev) => [...prev, { ...rest, id: newId, nom: `${rest.nom} (copie)` }]);
    setTotal((prev) => prev + 1);
    setLoading(false);
    return { data: newId };
  }

  function exportFichesToExcel() {
    const datas = (fiches || []).map((f) => ({
      id: f.id,
      nom: f.nom,
      portions: f.portions,
      cout_total: f.cout_total,
      cout_par_portion: f.cout_par_portion,
      actif: f.actif
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fiches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fiches_mamastock.xlsx");
  }

  function exportFichesToPDF() {
    const doc = new JSPDF();
    const rows = (fiches || []).map((f) => [
    f.nom,
    f.famille?.nom || "",
    f.portions,
    f.cout_par_portion]
    );
    doc.autoTable({ head: [["Nom", "Famille", "Portions", "Coût/portion"]], body: rows });
    doc.save("fiches_mamastock.pdf");
  }

  return { fiches, total, loading, error, getFiches, getFicheById, createFiche, updateFiche, deleteFiche, duplicateFiche, exportFichesToExcel, exportFichesToPDF };
}