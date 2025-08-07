// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';

export function useMenusGroupes() {
  const { mama_id } = useAuth();
  const [menus, setMenus] = useState([]);

  async function fetchMenusGroupes() {
    if (!mama_id) return [];
    const { data } = await supabase
      .from('menus_groupes')
      .select('*')
      .eq('mama_id', mama_id);
    setMenus(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function fetchMenuGroupe(id) {
    if (!mama_id || !id) return null;
    const { data } = await supabase
      .from('menus_groupes')
      .select(
        '*, fiches:menus_groupes_fiches(categorie, fiche_id, fiche:fiches_techniques(id, nom, cout_total, portions))'
      )
      .eq('id', id)
      .eq('mama_id', mama_id)
      .single();
    return data || null;
  }

  async function createOrUpdateMenu(menu) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { id, fiches = [], ...entete } = menu;
    let menuId = id;
    if (menuId) {
      await supabase
        .from('menus_groupes')
        .update(entete)
        .eq('id', menuId)
        .eq('mama_id', mama_id);
      await supabase
        .from('menus_groupes_fiches')
        .delete()
        .eq('menu_id', menuId);
    } else {
      const { data } = await supabase
        .from('menus_groupes')
        .insert([{ ...entete, mama_id }])
        .select('id')
        .single();
      menuId = data?.id;
    }
    if (menuId && fiches.length > 0) {
      const rows = fiches.map((f, index) => ({
        menu_id: menuId,
        fiche_id: f.fiche_id,
        categorie: f.categorie,
        ordre: index,
      }));
      await supabase.from('menus_groupes_fiches').insert(rows);
    }
    return { id: menuId };
  }

  function calculateMenuStats(menu) {
    const totalCost = (menu.fiches || []).reduce(
      (sum, f) => sum + (Number(f.cout) || 0),
      0
    );
    const marge = Number(menu.prix_vente || 0) - totalCost;
    const taux_food_cost = Number(menu.prix_vente || 0) > 0
      ? (totalCost / Number(menu.prix_vente)) * 100
      : 0;
    return { totalCost, marge, taux_food_cost };
  }

  async function exportMenuPDF() {
    // Stub: l'export réel sera implémenté côté client
    return true;
  }

  async function exportMenuExcel() {
    // Stub: l'export réel sera implémenté côté client
    return true;
  }

  return {
    menus,
    fetchMenusGroupes,
    fetchMenuGroupe,
    createOrUpdateMenu,
    calculateMenuStats,
    exportMenuPDF,
    exportMenuExcel,
  };
}

export default useMenusGroupes;
