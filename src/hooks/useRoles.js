import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useRoles() {
  useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les rôles
  async function fetchRoles({ search = "" } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase.from("roles").select("*");
    if (search) query = query.ilike("nom", `%${search}%`);

    const { data, error } = await query.order("nom", { ascending: true });
    setRoles(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un rôle
  async function addRole(roleData) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("roles")
      .insert([roleData]);
    if (error) setError(error);
    setLoading(false);
    await fetchRoles();
  }

  // 3. Modifier un rôle
  async function updateRole(id, updateFields) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("roles")
      .update(updateFields)
      .eq("id", id);
    if (error) setError(error);
    setLoading(false);
    await fetchRoles();
  }

  // 4. Désactiver/réactiver un rôle
  // Placeholder to maintain compatibility (no-op as roles have no 'actif')
  async function toggleRoleActive() {
    return { error: "Not supported" };
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
    importRolesFromExcel,
  };
}
