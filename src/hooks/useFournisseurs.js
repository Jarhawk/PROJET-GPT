import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les fournisseurs (recherche, tri, actif)
  async function fetchFournisseurs({ search = "", ville = "", actif = null } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("fournisseurs")
      .select("*")
      .eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (ville) query = query.ilike("ville", `%${ville}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query.order("nom", { ascending: true });
    setFournisseurs(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un fournisseur
  async function addFournisseur(fournisseur) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .insert([{ ...fournisseur, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchFournisseurs();
  }

  // 3. Modifier un fournisseur
  async function updateFournisseur(id, updateFields) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFournisseurs();
  }

  // 4. Désactiver/réactiver un fournisseur
  async function toggleFournisseurActive(id, actif) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .update({ actif })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFournisseurs();
  }

  // 5. Supprimer un fournisseur (avec confirmation)
  async function deleteFournisseur(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFournisseurs();
  }

  // 6. Export Excel
  function exportFournisseursToExcel() {
    const datas = (fournisseurs || []).map(f => ({
      id: f.id,
      nom: f.nom,
      ville: f.ville,
      email: f.email,
      actif: f.actif,
      mama_id: f.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fournisseurs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fournisseurs_mamastock.xlsx");
  }

  // 7. Import Excel (lecture seule, insertion à sécuriser)
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
    loading,
    error,
    fetchFournisseurs,
    addFournisseur,
    updateFournisseur,
    toggleFournisseurActive,
    deleteFournisseur,
    exportFournisseursToExcel,
    importFournisseursFromExcel,
  };
}
