// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useMenuDuJour() {
  const { mama_id } = useAuth();
  const [error, setError] = useState(null);

  const formatDate = (d) => new Date(d).toISOString().slice(0, 10);

  async function fetchWeek({ startDate }) {
    if (!mama_id) return [];
    const start = formatDate(startDate);
    const end = formatDate(new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 6)));
    const { data, error } = await supabase
      .from("v_menu_du_jour_resume")
      .select("*")
      .eq("mama_id", mama_id)
      .gte("date_menu", start)
      .lte("date_menu", end)
      .order("date_menu", { ascending: true });
    if (error) setError(error);
    return data || [];
  }

  async function fetchDay(date) {
    if (!mama_id) return {};
    const { data: menu } = await supabase
      .from("menus_jour")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("date_menu", formatDate(date))
      .single();
    if (!menu) return {};
    const { data: lignes } = await supabase
      .from("v_menu_du_jour_lignes_cout")
      .select("*")
      .eq("menu_id", menu.id)
      .order("categorie");
    return { menu, lignes: lignes || [] };
  }

  async function createOrUpdateMenu(date, lignes = []) {
    if (!mama_id) return { error: "no mama" };
    const dateStr = formatDate(date);
    const { data: existing } = await supabase
      .from("menus_jour")
      .select("id")
      .eq("mama_id", mama_id)
      .eq("date_menu", dateStr)
      .single();
    let menuId = existing?.id;
    if (!menuId) {
      const { data, error } = await supabase
        .from("menus_jour")
        .insert({ mama_id, date_menu: dateStr })
        .select("id")
        .single();
      if (error) return { error };
      menuId = data.id;
    } else {
      await supabase.from("menus_jour_lignes").delete().eq("menu_id", menuId).eq("mama_id", mama_id);
    }
    const toInsert = lignes.map((l) => ({ ...l, menu_id: menuId, mama_id }));
    if (toInsert.length) await supabase.from("menus_jour_lignes").insert(toInsert);
    return { id: menuId };
  }

  async function addLigne(menu_id, { categorie, fiche_id, portions }) {
    if (!mama_id) return;
    return supabase.from("menus_jour_lignes").insert({ menu_id, mama_id, categorie, fiche_id, portions });
  }

  async function removeLigne(ligne_id) {
    if (!mama_id) return;
    return supabase.from("menus_jour_lignes").delete().eq("id", ligne_id).eq("mama_id", mama_id);
  }

  async function duplicateDay(fromDate, toDate) {
    const from = await fetchDay(fromDate);
    const lignes = (from.lignes || []).map((l) => ({ categorie: l.categorie, fiche_id: l.fiche_id, portions: 1 }));
    await createOrUpdateMenu(toDate, lignes);
  }

  async function loadFromFavoris(menu_id, favoris = []) {
    if (!mama_id) return;
    const toInsert = favoris.map((f) => ({
      menu_id,
      mama_id,
      categorie: f.categorie,
      fiche_id: f.fiche_id,
      portions: f.portions_default || 1,
    }));
    if (toInsert.length) await supabase.from("menus_jour_lignes").insert(toInsert);
  }

  async function exportExcel(date) {
    const { lignes } = await fetchDay(date);
    const ws = XLSX.utils.json_to_sheet(
      (lignes || []).map((l) => ({
        categorie: l.categorie,
        fiche_id: l.fiche_id,
        portions: l.portions,
        cout_par_portion: l.cout_par_portion,
        cout_ligne_total: l.cout_ligne_total,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Menu");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return buf;
  }

  async function exportPdf(date) {
    const { lignes } = await fetchDay(date);
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Catégorie", "Fiche", "Portions", "Coût"]],
      body: (lignes || []).map((l) => [l.categorie, l.fiche_id, l.portions, l.cout_ligne_total?.toFixed(2)]),
    });
    return doc.output("arraybuffer");
  }

  async function getMonthlyAverageFoodCost(month) {
    if (!mama_id) return null;
    const { data } = await supabase
      .from("v_menu_du_jour_mensuel")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("mois", formatDate(month));
    return data?.[0] || null;
  }

  // legacy placeholders for older components
  function noop() {}

  return {
    fetchWeek,
    fetchDay,
    createOrUpdateMenu,
    addLigne,
    removeLigne,
    duplicateDay,
    loadFromFavoris,
    exportExcel,
    exportPdf,
    getMonthlyAverageFoodCost,
    // legacy exports
    menusDuJour: [],
    total: 0,
    loading: false,
    fetchMenusDuJour: noop,
    addMenuDuJour: noop,
    editMenuDuJour: noop,
    deleteMenuDuJour: noop,
    exportMenusDuJourToExcel: noop,
    fetchSemaineMenus: fetchWeek,
    fetchMenuForDate: fetchDay,
    setFicheForCategorie: noop,
    setPortions: noop,
    removeFicheFromMenu: noop,
    duplicateMenu: duplicateDay,
    reloadSavedFiches: fetchDay,
    error,
  };
}
