// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function useFiches() {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Liste paginée des fiches techniques
  async function getFiches({ search = "", actif = null, page = 1, limit = 20, sortBy = "nom", asc = true } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const sortField = ["nom", "cout_par_portion"].includes(sortBy) ? sortBy : "nom";
    let query = supabase
      .from("fiches_techniques")
      .select("*, famille:familles(id, nom), lignes:fiche_lignes(id)", { count: "exact" })
      .eq("mama_id", mama_id)
      .order(sortField, { ascending: asc })
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
      .from("fiches_techniques")
      .select(
        "*, famille:familles(id, nom), lignes:fiche_lignes(*, produit:produits(id, nom, unite:unites(nom), pmp))"
      )
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
    const { data, error: insertError } = await supabase
      .from("fiches_techniques")
      .insert([{ ...fiche, mama_id }])
      .select("id")
      .single();
    if (insertError) {
      setLoading(false);
      setError(insertError);
      throw insertError;
    }
    const ficheId = data.id;
    if (lignes.length > 0) {
      const toInsert = lignes.map(l => ({ fiche_id: ficheId, produit_id: l.produit_id, quantite: l.quantite, mama_id }));
      const { error: lignesError } = await supabase.from("fiche_lignes").insert(toInsert);
      if (lignesError) {
        setLoading(false);
        setError(lignesError);
        throw lignesError;
      }
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
    const { error: updateError } = await supabase
      .from("fiches_techniques")
      .update(fiche)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (updateError) {
      setLoading(false);
      setError(updateError);
      throw updateError;
    }
    const { error: deleteError } = await supabase
      .from("fiche_lignes")
      .delete()
      .eq("fiche_id", id)
      .eq("mama_id", mama_id);
    if (deleteError) {
      setLoading(false);
      setError(deleteError);
      throw deleteError;
    }
    if (lignes.length > 0) {
      const toInsert = lignes.map(l => ({ fiche_id: id, produit_id: l.produit_id, quantite: l.quantite, mama_id }));
      const { error: insertError } = await supabase.from("fiche_lignes").insert(toInsert);
      if (insertError) {
        setLoading(false);
        setError(insertError);
        throw insertError;
      }
    }
    setLoading(false);
    await getFiches();
    return { data: id };
  }

  // Désactivation logique
  async function deleteFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from("fiches_techniques")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (deleteError) {
      setLoading(false);
      setError(deleteError);
      throw deleteError;
    }
    setLoading(false);
    await getFiches();
    return { data: id };
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

  function exportFichesToPDF() {
    const doc = new jsPDF();
    const rows = (fiches || []).map(f => [
      f.nom,
      f.famille?.nom || "",
      f.portions,
      f.cout_par_portion,
    ]);
    doc.autoTable({ head: [["Nom", "Famille", "Portions", "Coût/portion"]], body: rows });
    doc.save("fiches_mamastock.pdf");
  }

  return { fiches, total, loading, error, getFiches, getFicheById, createFiche, updateFiche, deleteFiche, exportFichesToExcel, exportFichesToPDF };
}
