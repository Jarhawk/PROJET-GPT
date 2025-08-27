// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export async function importCostCentersFromExcel(file, sheetName) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const pick = sheetName && wb.Sheets[sheetName] ? sheetName : wb.SheetNames[0];
  const ws = wb.Sheets[pick];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws);
}

export function useCostCenters() {
  const { mama_id } = useAuth();
  const { log } = useAuditLog();
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchCostCenters({ search = "" } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("centres_de_cout")
      .select("id, nom, actif, activite, mama_id")
      .eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    const { data, error } = await query.order("nom", { ascending: true });
    setCostCenters(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function addCostCenter(values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("centres_de_cout")
      .insert([{ ...values, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchCostCenters();
    if (!error) await log("Ajout cost center", values);
  }

  async function updateCostCenter(id, values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("centres_de_cout")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchCostCenters();
    if (!error) await log("Modification cost center", { id, ...values });
  }

  async function deleteCostCenter(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("centres_de_cout")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchCostCenters();
    if (!error) await log("Suppression cost center", { id });
  }

  function exportCostCentersToExcel() {
    const list = Array.isArray(costCenters) ? costCenters : [];
    const datas = list.map(c => ({
      nom: c.nom,
      actif: c.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "CostCenters");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "centres_de_cout.xlsx");
  }

  async function importCostCentersFromExcelWithState(file, sheetName = "CostCenters") {
    setLoading(true);
    setError(null);
    try {
      return await importCostCentersFromExcel(file, sheetName);
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    costCenters,
    loading,
    error,
    fetchCostCenters,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    exportCostCentersToExcel,
    importCostCentersFromExcel: importCostCentersFromExcelWithState,
  };
}
