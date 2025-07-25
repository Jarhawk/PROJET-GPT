// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  };
}
