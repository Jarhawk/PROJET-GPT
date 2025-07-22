// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function usePermissions() {
  const { mama_id, role } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Récupérer toutes les permissions
  async function fetchPermissions({ roleId = null, userId = null } = {}) {
    if (!mama_id && role !== "superadmin") return [];
    setLoading(true);
    setError(null);
    let query = supabase.from("permissions").select("*");
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    if (roleId) query = query.eq("role_id", roleId);
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query.order("role_id", { ascending: true });
    setPermissions(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter une permission
  async function addPermission(permission) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("permissions")
      .insert([{ ...permission, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchPermissions();
  }

  // 3. Modifier une permission
  async function updatePermission(id, updateFields) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("permissions")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchPermissions();
  }

  // 4. Supprimer une permission
  async function deletePermission(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("permissions")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchPermissions();
  }

  // 5. Export Excel
  function exportPermissionsToExcel() {
    const datas = (permissions || []).map(p => ({
      id: p.id,
      role_id: p.role_id,
      user_id: p.user_id,
      droit: p.droit,
      actif: p.actif,
      mama_id: p.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Permissions");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "permissions_mamastock.xlsx");
  }

  // 6. Import Excel
  async function importPermissionsFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Permissions"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    addPermission,
    updatePermission,
    deletePermission,
    exportPermissionsToExcel,
    importPermissionsFromExcel,
  };
}
