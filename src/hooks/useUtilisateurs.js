// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { exportToCSV } from "@/lib/export/exportHelpers";

export function useUtilisateurs() {
  const { mama_id, role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les utilisateurs (superadmin : tous, sinon par mama_id)
  async function fetchUsers({ search = "", actif = null, filterRole = "" } = {}) {
    if (role !== "superadmin" && !mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs")
      .select("id, email, actif, mama_id, access_rights, role:roles(nom)")
      .order("email", { ascending: true });

    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    if (search) query = query.ilike("email", `%${search}%`);
    if (filterRole) query = query.eq("roles.nom", filterRole);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query;
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un utilisateur (invitation)
  async function addUser(user) {
    const targetMama = role === "superadmin" ? user.mama_id : mama_id;
    if (!targetMama) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("utilisateurs")
      .insert([{ ...user, mama_id: targetMama }]);
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 3. Modifier un utilisateur (rôle, droits, etc.)
  async function updateUser(id, updateFields) {
    if (!mama_id && role !== "superadmin") return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs")
      .update(updateFields)
      .eq("id", id);
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 4. Activer/désactiver un utilisateur
  async function toggleUserActive(id, actif) {
    if (!mama_id && role !== "superadmin") return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs")
      .update({ actif })
      .eq("id", id);
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 5. Supprimer un utilisateur (optionnel)
  async function deleteUser(id) {
    if (!mama_id && role !== "superadmin") return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs")
      .update({ actif: false })
      .eq("id", id);
    if (role !== "superadmin") query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 6. Export Excel
  function exportUsersToExcel(data = users) {
    const datas = (data || []).map(u => ({
      id: u.id,
      email: u.email,
      actif: u.actif,
      mama_id: u.mama_id,
      role: u.role,
      access_rights: JSON.stringify(u.access_rights),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Utilisateurs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "utilisateurs_mamastock.xlsx");
  }

  function exportUsersToCSV(data = users) {
    const datas = (data || []).map(u => ({
      id: u.id,
      email: u.email,
      actif: u.actif,
      mama_id: u.mama_id,
      role: u.role,
      access_rights: JSON.stringify(u.access_rights),
    }));
    exportToCSV(datas, { filename: "utilisateurs_mamastock.csv" });
  }

  // 7. Import Excel
  async function importUsersFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Utilisateurs"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    toggleUserActive,
    deleteUser,
    exportUsersToExcel,
    exportUsersToCSV,
    importUsersFromExcel,
  };
}
