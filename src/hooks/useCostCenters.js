// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
    let query = supabase.from("cost_centers").select("*").eq("mama_id", mama_id);
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
      .from("cost_centers")
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
      .from("cost_centers")
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
      .from("cost_centers")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchCostCenters();
    if (!error) await log("Suppression cost center", { id });
  }

  function exportCostCentersToExcel() {
    const datas = (costCenters || []).map(c => ({
      nom: c.nom,
      actif: c.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "CostCenters");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "cost_centers.xlsx");
  }

  async function importCostCentersFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet =
        workbook.SheetNames.includes("CostCenters")
          ? "CostCenters"
          : workbook.SheetNames[0];
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
      return arr;
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
    importCostCentersFromExcel,
  };
}
