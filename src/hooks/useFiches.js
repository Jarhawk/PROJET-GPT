import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useFiches() {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les fiches (filtrage recherche, famille, actif)
  async function fetchFiches({ search = "", famille = "", actif = null } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase.from("fiches").select("*").eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (famille) query = query.ilike("famille", `%${famille}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    const { data, error } = await query.order("famille", { ascending: true }).order("nom", { ascending: true });
    setFiches(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter une fiche
  async function addFiche(fiche) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fiches")
      .insert([{ ...fiche, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchFiches();
  }

  // 3. Modifier une fiche
  async function updateFiche(id, updateFields) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fiches")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFiches();
  }

  // 4. Supprimer une fiche
  async function deleteFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fiches")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFiches();
  }

  // 5. Désactiver/réactiver une fiche
  async function toggleFicheActive(id, actif) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fiches")
      .update({ actif })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFiches();
  }

  // 6. Export Excel
  function exportFichesToExcel() {
    const datas = (fiches || []).map(f => ({
      id: f.id,
      nom: f.nom,
      famille: f.famille,
      unite: f.unite,
      portions: f.portions,
      rendement: f.rendement,
      cout_total: f.cout_total,
      actif: f.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fiches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fiches_mamastock.xlsx");
  }

  // 7. Import Excel
  async function importFichesFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Fiches"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    fiches,
    loading,
    error,
    fetchFiches,
    addFiche,
    updateFiche,
    deleteFiche,
    toggleFicheActive,
    exportFichesToExcel,
    importFichesFromExcel,
  };
}
