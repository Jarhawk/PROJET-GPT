// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";

export function useMamas() {
  const { mama_id, role } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Récupérer tous les établissements (tous si superadmin, sinon accès limité)
  async function fetchMamas({ search = "" } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase.from("mamas").select("*");
    if (role !== "superadmin") query = query.eq("id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);

    const { data, error } = await query.order("nom", { ascending: true });
    setMamas(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un établissement
  async function addMama(mama) {
    if (role !== "superadmin") return { error: "Action non autorisée" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("mamas")
      .insert([mama]);
    if (error) setError(error);
    setLoading(false);
    await fetchMamas();
  }

  // 3. Modifier un établissement
  async function updateMama(id, updateFields) {
    if (role !== "superadmin" && id !== mama_id) {
      return { error: "Action non autorisée" };
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("mamas")
      .update(updateFields)
      .eq("id", id);
    if (error) setError(error);
    setLoading(false);
    await fetchMamas();
  }

  // 4. Activer/désactiver un établissement
  async function toggleMamaActive(id, actif) {
    if (role !== "superadmin" && id !== mama_id) {
      return { error: "Action non autorisée" };
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("mamas")
      .update({ actif })
      .eq("id", id);
    if (error) setError(error);
    setLoading(false);
    await fetchMamas();
  }



  // 5. Export Excel
  function exportMamasToExcel() {
    const datas = (mamas || []).map(m => ({
      id: m.id,
      nom: m.nom,
      ville: m.ville,
      email: m.email,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Mamas");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "mamas_mamastock.xlsx");
  }

  // 6. Import Excel
  async function importMamasFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Mamas");
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    mamas,
    loading,
    error,
    fetchMamas,
    addMama,
    updateMama,
    toggleMamaActive,
    exportMamasToExcel,
    importMamasFromExcel,
  };
}
