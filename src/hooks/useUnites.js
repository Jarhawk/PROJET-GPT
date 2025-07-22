// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useUnites() {
  const { mama_id } = useAuth();
  const [unites, setUnites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger toutes les unités (filtrage recherche, batch)
  async function fetchUnites({ search = "", includeInactive = false } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase.from("unites").select("*").eq("mama_id", mama_id);
    if (!includeInactive) query = query.eq("actif", true);
    if (search) query = query.ilike("nom", `%${search}%`);
    const { data, error } = await query.order("nom", { ascending: true });
    setUnites(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter une unité (avec vérif unicité)
  async function addUnite(nom) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    if (!nom) {
      const err = "Le nom est obligatoire.";
      setError(err);
      setLoading(false);
      return { error: err };
    }
    const { data: existing } = await supabase
      .from("unites")
      .select("id")
      .eq("mama_id", mama_id)
      .ilike("nom", nom);
    if (existing && existing.length > 0) {
      const err = "Unité déjà existante.";
      setLoading(false);
      setError(err);
      return { error: err };
    }
    const { data, error } = await supabase
      .from("unites")
      .insert([{ nom, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchUnites();
    return { data };
  }

  // 3. Modifier une unité
  async function updateUnite(id, newNom) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    if (!newNom) {
      setError("Le nom est obligatoire.");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("unites")
      .update({ nom: newNom })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchUnites();
  }

  // 4. Batch suppression (désactivation)
  async function batchDeleteUnites(ids = []) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("unites")
      .update({ actif: false })
      .in("id", ids)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchUnites();
  }

  // Convenience wrapper for single deletion
  async function deleteUnite(id) {
    return batchDeleteUnites([id]);
  }

  // 5. Export Excel
  function exportUnitesToExcel() {
    const datas = (unites || []).map(u => ({
      id: u.id,
      nom: u.nom,
      mama_id: u.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Unites");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "unites_mamastock.xlsx");
  }

  // 6. Import Excel
  async function importUnitesFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Unites"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    unites,
    loading,
    error,
    fetchUnites,
    addUnite,
    updateUnite,
    deleteUnite,
    batchDeleteUnites,
    exportUnitesToExcel,
    importUnitesFromExcel,
  };
}
