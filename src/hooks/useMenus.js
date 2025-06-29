// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useMenus() {
  const { mama_id } = useAuth();
  const { log } = useAuditLog();
  const [menus, setMenus] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les menus (recherche, date, batch)
  async function getMenus({
    search = "",
    date = "",
    start = "",
    end = "",
    actif = null,
    offset = 0,
    limit = 50,
  } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("menus")
      .select(
        "*, fiches:menu_fiches(fiche_id, fiche: fiches(id, nom))",
        { count: "exact" }
      )
      .eq("mama_id", mama_id);

    if (search) query = query.ilike("nom", `%${search}%`);
    if (date) query = query.eq("date", date);
    if (start) query = query.gte("date", start);
    if (end) query = query.lte("date", end);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, count, error } = await query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    setMenus(Array.isArray(data) ? data : []);
    setTotal(typeof count === "number" ? count : Array.isArray(data) ? data.length : 0);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un menu (avec ses fiches)
  async function createMenu(menu) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fiches, ...entete } = menu;
    const { data, error } = await supabase
      .from("menus")
      .insert([{ ...entete, mama_id }])
      .select("id")
      .single();
    if (error) { setError(error); setLoading(false); return; }
    // Ajout des fiches liées
    if (data?.id && Array.isArray(fiches) && fiches.length > 0) {
      const fichesWithFk = fiches.map(fiche_id => ({
        menu_id: data.id,
        fiche_id,
        mama_id,
      }));
      await supabase.from("menu_fiches").insert(fichesWithFk);
    }
    setLoading(false);
    if (!error) await log("Ajout menu", { id: data?.id, ...entete });
    await getMenus();
    return data;
  }

  // 3. Modifier un menu (maj entête + fiches)
  async function updateMenuData(id, menu) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fiches, ...entete } = menu;
    const { error: errorMenu } = await supabase
      .from("menus")
      .update(entete)
      .eq("id", id)
      .eq("mama_id", mama_id);
    // Suppression puis réinsertion des fiches
    if (Array.isArray(fiches)) {
      await supabase
        .from("menu_fiches")
        .delete()
        .eq("menu_id", id)
        .eq("mama_id", mama_id);
      const fichesWithFk = fiches.map(fiche_id => ({
        menu_id: id,
        fiche_id,
        mama_id,
      }));
      if (fichesWithFk.length > 0) {
        await supabase.from("menu_fiches").insert(fichesWithFk);
      }
    }
    setLoading(false);
    if (errorMenu) setError(errorMenu); else await log("Modification menu", { id, ...entete });
    await getMenus();
  }

  // 4. Récupérer un menu par id
  async function getMenuById(id) {
    if (!mama_id || !id) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from("menus")
      .select(
        "*, fiches:menu_fiches(fiche_id, fiche: fiches(id, nom, portions, cout_total))"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) { setError(error); return null; }
    return data;
  }

  // 5. Supprimer un menu (désactivation logique)
  async function deleteMenu(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("menus")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error); else await log("Désactivation menu", { id });
    await getMenus();
  }

  // 6. Désactiver/réactiver un menu
  async function toggleMenuActive(id, actif) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("menus")
      .update({ actif })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error); else await log("Changement actif menu", { id, actif });
    await getMenus();
  }

  // 7. Export Excel
  function exportMenusToExcel() {
    const datas = (menus || []).map(m => ({
      id: m.id,
      nom: m.nom,
      date: m.date,
      actif: m.actif,
      fiches: Array.isArray(m.fiches) ? m.fiches.map(f => f.fiche?.nom).join(", ") : "",
      mama_id: m.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Menus");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "menus_mamastock.xlsx");
  }

  // 8. Import Excel (lecture, à compléter avec création des liaisons menu_fiches)
  async function importMenusFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Menus"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    menus,
    total,
    loading,
    error,
    // nouvelles API
    getMenus,
    createMenu,
    updateMenu: updateMenuData,
    getMenuById,
    deleteMenu,
    // compatibilite
    fetchMenus: getMenus,
    addMenu: createMenu,
    editMenu: updateMenuData,
    toggleMenuActive,
    exportMenusToExcel,
    importMenusFromExcel,
  };
}
