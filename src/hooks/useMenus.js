// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from "@/hooks/useAuditLog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export async function importMenusFromExcel(file, sheetName) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const pick = sheetName && wb.Sheets[sheetName] ? sheetName : wb.SheetNames[0];
  const ws = wb.Sheets[pick];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws);
}

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
        "id, nom, date, actif, fiches:menu_fiches(fiche_id, mama_id)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .eq("fiches.mama_id", mama_id);

    if (search) query = query.ilike("nom", `%${search}%`);
    if (date) query = query.eq("date", date);
    if (start) query = query.gte("date", start);
    if (end) query = query.lte("date", end);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, count, error } = await query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    const rows = Array.isArray(data) ? data : [];
    const allFicheIds = new Set();
    for (const m of rows) {
      const fiches = Array.isArray(m.fiches) ? m.fiches : [];
      for (const f of fiches) {
        if (f?.fiche_id) allFicheIds.add(f.fiche_id);
      }
      m.fiches = fiches;
    }
    const fichesMap = {};
    if (allFicheIds.size) {
      const { data: fichesData } = await supabase
        .from("fiches_techniques")
        .select("fiche_id, nom, cout_par_portion")
        .eq("mama_id", mama_id)
        .in("fiche_id", [...allFicheIds]);
      for (const f of Array.isArray(fichesData) ? fichesData : []) {
        fichesMap[f.fiche_id] = {
          nom: f.nom,
          cout_par_portion: f.cout_par_portion
            ? Number(f.cout_par_portion)
            : null,
        };
      }
    }
    const mappedRows = [];
    for (const m of rows) {
      const fiches = [];
      for (const f of Array.isArray(m.fiches) ? m.fiches : []) {
        fiches.push({
          fiche_id: f.fiche_id,
          fiche: fichesMap[f.fiche_id] || null,
        });
      }
      mappedRows.push({ ...m, fiches });
    }
    setMenus(mappedRows);
      setTotal(typeof count === "number" ? count : mappedRows.length);
      setLoading(false);
      if (error) setError(error);
      return mappedRows;
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
      const fichesWithFk = [];
      for (const fiche_id of fiches) {
        fichesWithFk.push({ menu_id: data.id, fiche_id, mama_id });
      }
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
      const fichesWithFk = [];
      for (const fiche_id of fiches) {
        fichesWithFk.push({ menu_id: id, fiche_id, mama_id });
      }
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
      .select("id, nom, date, actif, fiches:menu_fiches(fiche_id, mama_id)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .eq("fiches.mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) { setError(error); return null; }
    const fichesRows = Array.isArray(data?.fiches) ? data.fiches : [];
    const ids = [];
    for (const f of fichesRows) {
      if (f?.fiche_id) ids.push(f.fiche_id);
    }
    const detailsMap = {};
    if (ids.length) {
      const { data: details } = await supabase
        .from("fiches_techniques")
        .select("fiche_id, nom, portions, cout_total, cout_par_portion")
        .eq("mama_id", mama_id)
        .in("fiche_id", ids);
      for (const d of Array.isArray(details) ? details : []) {
        detailsMap[d.fiche_id] = {
          nom: d.nom,
          cout_total: d.cout_total ? Number(d.cout_total) : null,
          cout_par_portion: d.cout_par_portion
            ? Number(d.cout_par_portion)
            : null,
          portions: d.portions ? Number(d.portions) : null,
        };
      }
    }
    const fiches = [];
    for (const f of fichesRows) {
      fiches.push({
        fiche_id: f.fiche_id,
        fiche: detailsMap[f.fiche_id] || null,
      });
    }
    return { id: data.id, nom: data.nom, date: data.date, actif: data.actif, fiches };
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
      const datas = [];
      if (Array.isArray(menus)) {
        for (const m of menus) {
          let ficheNames = "";
          if (Array.isArray(m.fiches)) {
            const names = [];
            for (const f of m.fiches) {
              if (f.fiche?.nom) names.push(f.fiche.nom);
            }
            ficheNames = names.join(", ");
          }
          datas.push({
            id: m.id,
            nom: m.nom,
            date: m.date,
            actif: m.actif,
            fiches: ficheNames,
            mama_id: m.mama_id,
          });
        }
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Menus");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "menus_mamastock.xlsx");
  }

  // 8. Import Excel (lecture, à compléter avec création des liaisons menu_fiches)
  async function importMenusFromExcelWithState(file, sheetName = "Menus") {
    setLoading(true);
    setError(null);
    try {
      return await importMenusFromExcel(file, sheetName);
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMenus(handler) {
    if (!mama_id) return () => {};
    const channel = supabase
      .channel('menus')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'menus',
          filter: `mama_id=eq.${mama_id}`,
        },
        (payload) => {
          setMenus((ms) => [payload.new, ...ms]);
          if (handler) handler(payload.new);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
    importMenusFromExcel: importMenusFromExcelWithState,
    subscribeToMenus,
  };
}
