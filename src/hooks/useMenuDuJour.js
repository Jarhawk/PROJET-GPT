// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSPDF from "jspdf";

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
        "id, nom, date, prix_vente_ttc, tva, actif, fiches:menus_jour_fiches(fiche_id, quantite, fiche:fiches_techniques(id, nom, cout_par_portion))",
        { count: "exact" }
      )
      .eq("mama_id", mama_id);
    if (search) query = query.ilike("nom", `%${search}%`);
    if (date) query = query.eq("date", date);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    const { data, count, error } = await query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    const rows = Array.isArray(data) ? data : [];
    const withCost = rows
      .map((m) => {
          const cost = (m.fiches || []).reduce(
            (s, f) => s + (Number(f.quantite || 1) * (Number(f.fiche?.cout_par_portion) || 0)),
            0
          );
          return {
            ...m,
            prix_vente_ttc: m.prix_vente_ttc ? Number(m.prix_vente_ttc) : null,
            tva: m.tva ? Number(m.tva) : null,
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

  // Helpers planning Menu du Jour

  async function fetchWeek({ startDate }) {
    if (!mama_id) return [];
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const { data, error } = await supabase
      .from("menus_jour")
      .select(
        "date, items:menus_jour_fiches(quantite, fiche:fiches_techniques(id, cout_par_portion))"
      )
      .eq("mama_id", mama_id)
      .gte("date", start.toISOString().slice(0, 10))
      .lte("date", end.toISOString().slice(0, 10))
      .order("date", { ascending: true });
    if (error) { setError(error); return []; }
    const rows = Array.isArray(data) ? data : [];
    return rows.map((m) => ({
      date_menu: m.date,
      cout_total: (m.items || []).reduce(
        (s, i) => s + Number(i.quantite || 1) * Number(i.fiche?.cout_par_portion || 0),
        0,
      ),
    }));
  }

  async function fetchDay(date) {
    if (!mama_id) return {};
    const { data: menu, error: errMenu } = await supabase
      .from("menus_jour")
      .select(
        "id, nom, date, items:menus_jour_fiches(id, fiche_id, quantite, fiche:fiches_techniques(id, nom, cout_par_portion))"
      )
      .eq("mama_id", mama_id)
      .eq("date", date)
      .single();
    if (errMenu && errMenu.code !== "PGRST116") { setError(errMenu); return {}; }
    const lignes = (Array.isArray(menu?.items) ? menu.items : []).map((l) => ({
      id: l.id,
      fiche_id: l.fiche_id,
      portions: Number(l.quantite) || 1,
      cout_par_portion: l.fiche?.cout_par_portion ? Number(l.fiche.cout_par_portion) : null,
      cout_ligne_total: Number(l.quantite || 1) * Number(l.fiche?.cout_par_portion || 0),
    }));
    return { menu, lignes };
  }

  async function createOrUpdateMenu(date, lignes = []) {
    if (!mama_id) return { error: "Aucun mama_id" };
    const { data, error: err } = await supabase
      .from("menus_jour")
      .upsert({ mama_id, date }, { onConflict: "mama_id,date" })
      .select("id")
      .single();
    if (err) { setError(err); return { error: err }; }
    const menuId = data.id;
    await supabase
      .from("menus_jour_fiches")
      .delete()
      .eq("menu_jour_id", menuId)
      .eq("mama_id", mama_id);
    if (Array.isArray(lignes) && lignes.length) {
      const rows = lignes.map((l) => ({
        menu_jour_id: menuId,
        fiche_id: l.fiche_id,
        quantite: l.portions || l.quantite || 1,
        mama_id,
      }));
      await supabase.from("menus_jour_fiches").insert(rows);
    }
    return { id: menuId };
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
    fetchWeek,
    fetchDay,
    createOrUpdateMenu,
  };
}
