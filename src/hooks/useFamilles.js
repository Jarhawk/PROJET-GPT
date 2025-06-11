import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useFamilles() {
  const { mama_id } = useAuth();
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger toutes les familles (recherche, batch)
  async function fetchFamilles({ search = "" } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase.from("familles").select("*").eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    const { data, error } = await query.order("nom", { ascending: true });
    setFamilles(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter une famille (avec vérif unicité)
  async function addFamille(nom) {
    setLoading(true);
    setError(null);
    if (!nom) {
      setError("Le nom est obligatoire.");
      setLoading(false);
      return;
    }
    // Vérifie unicité (insensible à la casse)
    const { data: existing } = await supabase
      .from("familles")
      .select("id")
      .eq("mama_id", mama_id)
      .ilike("nom", nom);
    if (existing && existing.length > 0) {
      setLoading(false);
      setError("Famille déjà existante.");
      return;
    }
    const { error } = await supabase
      .from("familles")
      .insert([{ nom, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchFamilles();
  }

  // 3. Modifier une famille
  async function updateFamille(id, newNom) {
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
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("familles")
      .delete()
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Familles"]);
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
