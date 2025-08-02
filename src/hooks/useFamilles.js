// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";

export async function deleteFamille(id, mama_id) {
  return await supabase.from("familles").delete().match({ id, mama_id });
}

export function useFamilles() {
  const { mama_id } = useAuth();
  const [familles, setFamilles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chargement des familles (avec pagination / recherche)
  const fetchFamilles = useCallback(
    async ({
      includeInactive = false,
      search = "",
      page = 1,
      limit = 50,
    } = {}) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase
        .from("familles")
        .select("id, nom, actif, famille_parent_id", { count: "exact" })
        .eq("mama_id", mama_id)
        .order("nom", { ascending: true })
        .range((page - 1) * limit, page * limit - 1);
      if (!includeInactive) query = query.eq("actif", true);
      if (search) query = query.ilike("nom", `%${search}%`);
      const { data, error, count } = await query;
      if (error) {
        setError(error);
        setFamilles([]);
        setTotal(0);
      } else {
        setFamilles(Array.isArray(data) ? data : []);
        setTotal(count || 0);
      }
      setLoading(false);
      return data || [];
    },
    [mama_id]
  );

  // Ajout d'une famille
  async function addFamille({ nom, actif = true, famille_parent_id = null }) {
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
      .insert([{ nom, actif, famille_parent_id, mama_id }])
      .select("id, nom, actif, famille_parent_id")
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchFamilles();
    return { data };
  }

  // Mise à jour d'une famille
  async function updateFamille(id, fields) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const payload = typeof fields === "string" ? { nom: fields } : fields;
    if (!payload.nom) {
      setError("Le nom est obligatoire.");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("familles")
      .update(payload)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchFamilles();
  }

  // Désactivation de familles (batch)
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

  // Export Excel
  function exportFamillesToExcel() {
    const datas = (familles || []).map((f) => ({
      id: f.id,
      nom: f.nom,
      mama_id: mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Familles");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "familles_mamastock.xlsx");
  }

  // Import Excel
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
    total,
    loading,
    error,
    fetchFamilles,
    addFamille,
    updateFamille,
    deleteFamille,
    batchDeleteFamilles,
    exportFamillesToExcel,
    importFamillesFromExcel,
  };
}
