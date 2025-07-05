// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { exportToCSV } from "@/lib/export/exportHelpers";

export function useRoles() {
  const { mama_id, role } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les rôles
  async function fetchRoles({ search = "", actif = null } = {}) {
    if (role !== "superadmin" && !mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("roles")
      .select("id, nom, description, actif, mama_id, access_rights");
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query.order("nom", { ascending: true });
    setRoles(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un rôle
  async function addRole(roleData) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("roles")
      .insert([{ ...roleData, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchRoles();
  }

  // 3. Modifier un rôle
  async function updateRole(id, updateFields) {
    if (!mama_id && role !== "superadmin") return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("roles")
      .update(updateFields)
      .eq("id", id);
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchRoles();
  }

  // 4. Désactiver/réactiver un rôle
  async function toggleRoleActive(id, actif) {
    if (!mama_id && role !== "superadmin") return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase.from("roles").update({ actif }).eq("id", id);
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchRoles();
  }

  // 5. Export Excel
  function exportRolesToExcel() {
    const datas = (roles || []).map(r => ({
      id: r.id,
      nom: r.nom,
      description: r.description,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Roles");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "roles_mamastock.xlsx");
  }

  function exportRolesToCSV(data = roles) {
    exportToCSV(data, { filename: "roles_mamastock.csv" });
  }

  // 6. Import Excel
  async function importRolesFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Roles"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    roles,
    loading,
    error,
    fetchRoles,
    addRole,
    updateRole,
    toggleRoleActive,
    exportRolesToExcel,
    exportRolesToCSV,
    importRolesFromExcel,
  };
}
