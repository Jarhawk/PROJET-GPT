// src/hooks/useFournisseurs.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les fournisseurs (filtrage par mama_id automatiquement)
  async function getFournisseurs({ search = "", actif = null, page = 1, limit = 20 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("fournisseurs")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("nom", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.or(`nom.ilike.%${search}%,ville.ilike.%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error, count } = await query;
    setFournisseurs(Array.isArray(data) ? data : []);
    setTotal(count || 0);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un fournisseur
  async function createFournisseur(fournisseur) {
    if (!mama_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .insert([{ ...fournisseur, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      await getFournisseurs();
    }
  }

  // 3. Modifier un fournisseur
  async function updateFournisseur(id, updateFields) {
    if (!mama_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      await getFournisseurs();
    }
  }

  // 4. Désactiver un fournisseur (soft delete)
  async function disableFournisseur(id) {
    if (!mama_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      await getFournisseurs();
    }
  }

  // 5. Export Excel
  function exportFournisseursToExcel() {
    const datas = (fournisseurs || []).map(f => ({
      id: f.id,
      nom: f.nom,
      ville: f.ville,
      tel: f.tel,
      contact: f.contact,
      actif: f.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fournisseurs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fournisseurs_mamastock.xlsx");
  }

  // 6. Import Excel
  async function importFournisseursFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Fournisseurs"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    fournisseurs,
    total,
    loading,
    error,
    getFournisseurs,
    createFournisseur,
    updateFournisseur,
    disableFournisseur,
    exportFournisseursToExcel,
    importFournisseursFromExcel,
  };
}
