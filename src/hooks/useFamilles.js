// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";

export function useFamilles() {
  const { mama_id } = useAuth();
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger toutes les familles (recherche, batch)
  // Charge la liste des familles avec option de recherche
  async function fetchFamilles({ search = "", includeInactive = false } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase.from("familles").select("*").eq("mama_id", mama_id);
    if (!includeInactive) query = query.eq("actif", true);
    if (search) query = query.ilike("nom", `%${search}%`);
    const { data, error } = await query.order("nom", { ascending: true });
    setFamilles(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter une famille (avec vérif unicité)
  async function addFamille(nom) {
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
      .from("familles")
      .select("id")
      .eq("mama_id", mama_id)
      .ilike("nom", nom);
    if (existing && existing.length > 0) {
      const err = "Famille déjà existante.";
      setLoading(false);
      setError(err);
      return { error: err };
    }
    const { data, error } = await supabase
      .from("familles")
      .insert([{ nom, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchFamilles();
    return { data };
  }

  // 3. Modifier une famille
  async function updateFamille(id, newNom) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    if (!newNom) {
      setError("Le nom est obligatoire.");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("familles")
      .update({ nom: newNom })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFamilles();
  }

  // 4. Batch suppression (désactivation réelle ou suppression selon politique)
  async function batchDeleteFamilles(ids = []) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("familles")
      .update({ actif: false })
      .in("id", ids)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFamilles();
  }

  // 5. Export Excel
  function exportFamillesToExcel() {
    const datas = (familles || []).map(f => ({
      id: f.id,
      nom: f.nom,
      mama_id: f.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Familles");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "familles_mamastock.xlsx");
  }

  // 6. Import Excel
  async function importFamillesFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Familles");
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    familles,
    loading,
    error,
    fetchFamilles,
    addFamille,
    updateFamille,
    batchDeleteFamilles,
    exportFamillesToExcel,
    importFamillesFromExcel,
  };
}
