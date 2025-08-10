// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";
import { exportToCSV } from "@/lib/export/exportHelpers";

export function useUtilisateurs() {
  const { mama_id, isSuperadmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les utilisateurs (superadmin : tous, sinon par mama_id)
  async function fetchUsers({ search = "", actif = null } = {}) {
    if (!isSuperadmin && !mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs_complets")
      .select("*")
      .order("nom", { ascending: true });

    if (!isSuperadmin) query = query.eq("mama_id", mama_id);
    if (search) {
      query = query
        .ilike("nom", `%${search}%`)
        .ilike("email", `%${search}%`);
    }
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query;
    const cleaned = (Array.isArray(data) ? data : []);
    setUsers(cleaned);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function fetchRoles() {
    setLoading(true);
    setError(null);
    let query = supabase.from("roles").select("id, nom").order("nom", { ascending: true });
    if (!isSuperadmin) query = query.eq("mama_id", mama_id);
    const { data, error } = await query;
    setRoles(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un utilisateur (invitation)
  async function addUser(user) {
    const targetMama = isSuperadmin ? user.mama_id : mama_id;
    if (!targetMama) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("create_utilisateur", {
      email: user.email,
      nom: user.nom,
      role_id: user.role_id,
      mama_id: targetMama,
    });
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 3. Modifier un utilisateur (rôle, droits, etc.)
  async function updateUser(id, updateFields) {
    if (!mama_id && !isSuperadmin) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    if (updateFields.email !== undefined && !updateFields.email) {
      setLoading(false);
      return { error: "Email manquant" };
    }
    if (updateFields.auth_id === undefined) updateFields.auth_id = null;
    let rights = null;
    if (updateFields.role_id) {
      const { data: roleData } = await supabase
        .from("roles")
        .select("nom, access_rights")
        .eq("id", updateFields.role_id)
        .maybeSingle();
      if (roleData?.nom === "superadmin" && !isSuperadmin) {
        setLoading(false);
        return { error: "Rôle interdit" };
      }
      rights = roleData?.access_rights ?? null;
    }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("utilisateurs")
      .upsert({
        id,
        ...updateFields,
        ...(rights ? { access_rights: rights } : {}),
        updated_at: now,
      });
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 4. Activer/désactiver un utilisateur
  async function toggleUserActive(id, actif) {
    if (!mama_id && !isSuperadmin) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs")
      .update({ actif })
      .eq("id", id);
    if (!isSuperadmin) query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 5. Réinitialiser le mot de passe via auth_id
  async function resetPassword(authId) {
    if (!authId) return { error: "auth_id manquant" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      user_id: authId,
    });
    if (error) setError(error);
    setLoading(false);
    return { data, error };
  }

  // 6. Supprimer un utilisateur (optionnel)
  async function deleteUser(id) {
    if (!mama_id && !isSuperadmin) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("utilisateurs")
      .update({ actif: false })
      .eq("id", id);
    if (!isSuperadmin) query = query.eq("mama_id", mama_id);
    const { error } = await query;
    if (error) setError(error);
    setLoading(false);
    await fetchUsers();
  }

  // 6. Export Excel
  // (numérotation ajustée après ajout resetPassword)
  function exportUsersToExcel(data = users) {
    const datas = (data || []).map(u => ({
      id: u.id,
      nom: u.nom,
      email: u.email,
      role_id: u.role_id,
      actif: u.actif,
      mama_id: u.mama_id,
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
      nom: u.nom,
      email: u.email,
      role_id: u.role_id,
      actif: u.actif,
      mama_id: u.mama_id,
      access_rights: JSON.stringify(u.access_rights),
    }));
    exportToCSV(datas, { filename: "utilisateurs_mamastock.csv" });
  }

  // 7. Import Excel
  async function importUsersFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Utilisateurs");
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
    roles,
    loading,
    error,
    // listing
    fetchUsers,
    getUtilisateurs: fetchUsers,
    fetchRoles,
    // mutations
    addUser,
    createUtilisateur: addUser,
    updateUser,
    updateUtilisateur: updateUser,
    toggleUserActive,
    deleteUser,
    deleteUtilisateur: deleteUser,
    resetPassword,
    // exports
    exportUsersToExcel,
    exportUsersToCSV,
    importUsersFromExcel,
  };
}
