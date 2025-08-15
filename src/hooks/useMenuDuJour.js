// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export function useMenuDuJour() {
  const { mama_id } = useAuth();
  const { log } = useAuditLog();
  const [menusDuJour, setMenus] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchMenusDuJour({ search = "", date = "", actif = null, offset = 0, limit = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("menus_jour")
      .select(
        "*, fiches:menus_jour_fiches(fiche_id, quantite, fiche:fiches_techniques(id, nom, cout_par_portion))",
        { count: "exact" }
      )
      .eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (date) query = query.eq("date", date);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    const { data, count, error } = await query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    const withCost = Array.isArray(data)
      ? data.map((m) => {
          const cost = (m.fiches || []).reduce(
            (s, f) => s + (Number(f.quantite || 1) * (Number(f.fiche?.cout_par_portion) || 0)),
            0
          );
          return {
            ...m,
            cout_total: cost,
            marge: m.prix_vente_ttc ? ((Number(m.prix_vente_ttc) - cost) / Number(m.prix_vente_ttc)) * 100 : null,
          };
        })
      : [];
    setMenus(withCost);
    setTotal(typeof count === "number" ? count : withCost.length);
    setLoading(false);
    if (error) setError(error);
    return withCost;
  }

  async function addMenuDuJour(menu) {
    if (!mama_id) return { error: "Aucun mama_id" };
    const { fiches = [], ...entete } = menu;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("menus_jour")
      .insert([{ ...entete, mama_id }])
      .select("id")
      .single();
    if (!error && data?.id && fiches.length) {
      const toInsert = fiches.map((fiche_id) => ({ menu_jour_id: data.id, fiche_id, mama_id }));
      await supabase.from("menus_jour_fiches").insert(toInsert);
    }
    setLoading(false);
    if (error) setError(error); else await log("Ajout menu du jour", { id: data?.id, ...entete });
    await fetchMenusDuJour();
    return data;
  }

  async function editMenuDuJour(id, menu) {
    if (!mama_id) return { error: "Aucun mama_id" };
    const { fiches = [], ...entete } = menu;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from("menus_jour")
      .update(entete)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (!err) {
      await supabase.from("menus_jour_fiches").delete().eq("menu_jour_id", id).eq("mama_id", mama_id);
      if (fiches.length) {
        const toInsert = fiches.map((fiche_id) => ({ menu_jour_id: id, fiche_id, mama_id }));
        await supabase.from("menus_jour_fiches").insert(toInsert);
      }
    }
    setLoading(false);
    if (err) setError(err); else await log("Modification menu du jour", { id, ...entete });
    await fetchMenusDuJour();
  }

  async function deleteMenuDuJour(id) {
    if (!mama_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("menus_jour")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error); else await log("Suppression menu du jour", { id });
    await fetchMenusDuJour();
  }

  function exportMenusDuJourToExcel() {
    const datas = (menusDuJour || []).map((m) => ({
      id: m.id,
      nom: m.nom,
      date: m.date,
      prix_vente_ttc: m.prix_vente_ttc,
      cout_total: m.cout_total,
      marge: m.marge,
      fiches: (m.fiches || []).map((f) => f.fiche?.nom).join(", "),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "MenusJour");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "menus_jour.xlsx");
  }

  // --- Nouveaux helpers planning Menu du Jour ---

  async function fetchSemaineMenus(startDate) {
    if (!mama_id) return [];
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    const { data, error } = await supabase
      .from("menus_jour")
      .select(
        "date, categorie, fiche_id, portions, fiche:fiches_techniques(id, nom, cout_total, portions)"
      )
      .eq("mama_id", mama_id)
      .gte("date", start.toISOString().slice(0, 10))
      .lte("date", end.toISOString().slice(0, 10));
    if (error) setError(error);
    return data || [];
  }

  async function fetchMenuForDate(date) {
    if (!mama_id) return {};
    const { data, error } = await supabase
      .from("menus_jour")
      .select(
        "categorie, fiche_id, portions, fiche:fiches_techniques(id, nom, cout_total, portions)"
      )
      .eq("mama_id", mama_id)
      .eq("date", date);
    if (error) {
      setError(error);
      return {};
    }
    const mapped = {};
    (data || []).forEach((row) => {
      const fiche = row.fiche;
      const cout_unitaire = fiche && fiche.cout_total && fiche.portions
        ? Number(fiche.cout_total) / Number(fiche.portions)
        : 0;
      mapped[row.categorie] = {
        fiche_id: row.fiche_id,
        nom: fiche?.nom,
        cout_unitaire,
        portions: Number(row.portions) || 1,
      };
    });
    return mapped;
  }

  async function setFicheForCategorie(date, categorie, fiche_id) {
    if (!mama_id) return;
    return supabase
      .from("menus_jour")
      .upsert(
        { mama_id, date, categorie, fiche_id },
        { onConflict: "date,categorie,mama_id" }
      );
  }

  async function setPortions(date, categorie, portions) {
    if (!mama_id) return;
    return supabase
      .from("menus_jour")
      .update({ portions })
      .match({ mama_id, date, categorie });
  }

  async function removeFicheFromMenu(date, categorie) {
    if (!mama_id) return;
    return supabase
      .from("menus_jour")
      .delete()
      .match({ mama_id, date, categorie });
  }

  async function duplicateMenu(fromDate, toDate) {
    if (!mama_id) return;
    const { data, error } = await supabase
      .from("menus_jour")
      .select("categorie, fiche_id, portions")
      .match({ mama_id, date: fromDate });
    if (!error && Array.isArray(data) && data.length) {
      const toInsert = data.map((d) => ({ ...d, date: toDate, mama_id }));
      await supabase.from("menus_jour").insert(toInsert);
    }
  }

  async function reloadSavedFiches(date) {
    return fetchMenuForDate(date);
  }

  // --- Nouveau module Menu du Jour ---

  async function fetchWeek({ startDate }) {
    if (!mama_id) return [];
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const { data, error } = await supabase
      .from("v_menu_du_jour_resume")
      .select("*")
      .eq("mama_id", mama_id)
      .gte("date_menu", start.toISOString().slice(0, 10))
      .lte("date_menu", end.toISOString().slice(0, 10));
    if (error) setError(error);
    return data || [];
  }

  async function fetchDay(date) {
    if (!mama_id) return {};
    const { data: menu, error: errMenu } = await supabase
      .from("menus_jour")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("date_menu", date)
      .single();
    if (errMenu && errMenu.code !== "PGRST116") {
      setError(errMenu);
      return {};
    }
    const menuId = menu?.id;
    let lignes = [];
    if (menuId) {
      const { data: lignesData, error: errLignes } = await supabase
        .from("v_menu_du_jour_lignes_cout")
        .select("*")
        .eq("menu_id", menuId)
        .eq("mama_id", mama_id);
      if (errLignes) setError(errLignes); else lignes = lignesData;
    }
    return { menu, lignes };
  }

  async function createOrUpdateMenu(date, lignes = []) {
    if (!mama_id) return { error: "Aucun mama_id" };
    const { data, error: err } = await supabase
      .from("menus_jour")
      .upsert({ mama_id, date_menu: date }, { onConflict: "mama_id,date_menu" })
      .select("id")
      .single();
    if (err) {
      setError(err);
      return { error: err };
    }
    const menuId = data.id;
    await supabase
      .from("menus_jour_lignes")
      .delete()
      .eq("menu_id", menuId)
      .eq("mama_id", mama_id);
    if (Array.isArray(lignes) && lignes.length) {
      const rows = lignes.map((l) => ({ ...l, menu_id: menuId, mama_id }));
      await supabase.from("menus_jour_lignes").insert(rows);
    }
    return { id: menuId };
  }

  async function addLigne(menu_id, { categorie, fiche_id, portions }) {
    if (!mama_id) return;
    return supabase
      .from("menus_jour_lignes")
      .insert({ menu_id, categorie, fiche_id, portions, mama_id });
  }

  async function removeLigne(ligne_id) {
    if (!mama_id) return;
    return supabase
      .from("menus_jour_lignes")
      .delete()
      .eq("id", ligne_id)
      .eq("mama_id", mama_id);
  }

  async function duplicateDay(fromDate, toDate) {
    if (!mama_id) return;
    const { lignes } = await fetchDay(fromDate);
    await createOrUpdateMenu(
      toDate,
      (lignes || []).map((l) => ({ categorie: l.categorie, fiche_id: l.fiche_id, portions: 1 }))
    );
  }

  async function loadFromFavoris(menu_id, favoris = []) {
    if (!mama_id || !Array.isArray(favoris) || !favoris.length) return;
    const rows = favoris.map((f) => ({
      menu_id,
      mama_id,
      categorie: f.categorie,
      fiche_id: f.fiche_id,
      portions: f.portions_default || 1,
    }));
    return supabase.from("menus_jour_lignes").insert(rows);
  }

  async function exportExcel(date) {
    const { lignes } = await fetchDay(date);
    const data = (lignes || []).map((l) => ({
      categorie: l.categorie,
      fiche_id: l.fiche_id,
      portions: l.portions,
      cout_par_portion: l.cout_par_portion,
      cout_ligne_total: l.cout_ligne_total,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Menu");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `menu_${date}.xlsx`);
  }

  async function exportPdf(date) {
    const { lignes } = await fetchDay(date);
    const doc = new jsPDF();
    doc.text(`Menu du ${date}`, 10, 10);
    let y = 20;
    (lignes || []).forEach((l) => {
      const line = `${l.categorie} - ${l.portions} x ${(l.cout_par_portion || 0).toFixed(2)}€`;
      doc.text(line, 10, y);
      y += 8;
    });
    const pdf = doc.output("arraybuffer");
    saveAs(new Blob([pdf], { type: "application/pdf" }), `menu_${date}.pdf`);
  }

  async function getMonthlyAverageFoodCost(month) {
    if (!mama_id) return null;
    const { data, error } = await supabase
      .from("v_menu_du_jour_mensuel")
      .select("cout_total_mois")
      .eq("mama_id", mama_id)
      .eq("mois", month);
    if (error) {
      setError(error);
      return null;
    }
    return data?.[0]?.cout_total_mois ?? null;
  }

  return {
    menusDuJour,
    total,
    loading,
    error,
    fetchMenusDuJour,
    addMenuDuJour,
    editMenuDuJour,
    deleteMenuDuJour,
    exportMenusDuJourToExcel,
    fetchSemaineMenus,
    fetchMenuForDate,
    setFicheForCategorie,
    setPortions,
    removeFicheFromMenu,
    duplicateMenu,
    reloadSavedFiches,
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
  };
}
