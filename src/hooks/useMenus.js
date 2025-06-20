import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useMenus() {
  const { mama_id } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les menus (recherche, date, batch)
  async function fetchMenus({ search = "", date = "", actif = null } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("menus")
      .select("*, fiches:menu_fiches(fiche_id, fiche: fiches(id, nom))")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (search) query = query.ilike("nom", `%${search}%`);
    if (date) query = query.eq("date", date);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query;
    setMenus(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un menu (avec ses fiches)
  async function addMenu(menu) {
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
    await fetchMenus();
    return data;
  }

  // 3. Modifier un menu (maj entête + fiches)
  async function updateMenu(id, menu) {
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
      await supabase.from("menu_fiches").delete().eq("menu_id", id);
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
    if (errorMenu) setError(errorMenu);
    await fetchMenus();
  }

  // 4. Supprimer un menu (et ses liaisons)
  async function deleteMenu(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    await supabase.from("menu_fiches").delete().eq("menu_id", id);
    const { error } = await supabase.from("menus").delete().eq("id", id).eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    await fetchMenus();
  }

  // 5. Désactiver/réactiver un menu
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
    if (error) setError(error);
    await fetchMenus();
  }

  // 6. Export Excel
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

  // 7. Import Excel (lecture, à compléter avec création des liaisons menu_fiches)
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
    loading,
    error,
    fetchMenus,
    addMenu,
    updateMenu,
    deleteMenu,
    toggleMenuActive,
    exportMenusToExcel,
    importMenusFromExcel,
  };
}
