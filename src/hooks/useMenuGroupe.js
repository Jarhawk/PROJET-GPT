// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';

export default function useMenuGroupe() {
  const { mama_id } = useAuth();
  const [menus, setMenus] = useState([]);

  async function fetchMenusGroupes({ q, statut, actif } = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from('menu_groupes')
      .select('*, resume:v_menu_groupe_resume(*)')
      .eq('mama_id', mama_id);
    if (q) query = query.ilike('nom', `%${q}%`);
    if (statut) query = query.eq('statut', statut);
    if (typeof actif === 'boolean') query = query.eq('actif', actif);
    const { data } = await query;
    setMenus(data || []);
    return data || [];
  }

  async function fetchMenuGroupeById(id) {
    if (!mama_id || !id) return null;
    const { data: menu } = await supabase
      .from('menu_groupes')
      .select('*')
      .eq('id', id)
      .eq('mama_id', mama_id)
      .single();
    const { data: lignes } = await supabase
      .from('menu_groupe_lignes')
      .select('*, fiche:fiches_techniques(id, nom)')
      .eq('menu_groupe_id', id)
      .order('position');
    const { data: resume } = await supabase
      .from('v_menu_groupe_resume')
      .select('*')
      .eq('menu_groupe_id', id)
      .single();
    const { data: couts } = await supabase
      .from('v_menu_groupe_couts')
      .select('*')
      .eq('menu_groupe_id', id);
    return { menu, lignes, resume, couts };
  }

  async function createMenuGroupe(payload) {
    if (!mama_id) return null;
    const { data } = await supabase
      .from('menu_groupes')
      .insert([{ ...payload, mama_id }])
      .select('*')
      .single();
    return data;
  }

  async function updateMenuGroupe(id, payload) {
    const { data } = await supabase
      .from('menu_groupes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    return data;
  }

  async function addLigne(menu_groupe_id, { categorie, fiche_id, portions_par_personne = 1, position }) {
    const { data } = await supabase
      .from('menu_groupe_lignes')
      .insert([{ menu_groupe_id, mama_id, categorie, fiche_id, portions_par_personne, position }])
      .select('*')
      .single();
    return data;
  }

  async function removeLigne(ligne_id) {
    await supabase.from('menu_groupe_lignes').delete().eq('id', ligne_id);
  }

  async function reorderLignes(menu_groupe_id, lignesReordonnees) {
    const updates = lignesReordonnees.map((l, idx) =>
      supabase
        .from('menu_groupe_lignes')
        .update({ position: idx })
        .eq('id', l.id)
        .eq('menu_groupe_id', menu_groupe_id)
    );
    await Promise.all(updates);
  }

  async function setStatut(id, statut) {
    await supabase.from('menu_groupes').update({ statut }).eq('id', id);
  }

  async function archiver(id) {
    await supabase
      .from('menu_groupes')
      .update({ archive: true, archive_at: new Date().toISOString() })
      .eq('id', id);
  }

  async function loadModele(modele_id) {
    const { data } = await supabase
      .from('menu_groupe_modele_lignes')
      .select('*')
      .eq('modele_id', modele_id)
      .order('position');
    return data || [];
  }

  async function saveAsModele(menu_groupe_id, nom_modele) {
    const { data: modele } = await supabase
      .from('menu_groupe_modeles')
      .insert([{ mama_id, nom: nom_modele }])
      .select('id')
      .single();
    const { data: lignes } = await supabase
      .from('menu_groupe_lignes')
      .select('*')
      .eq('menu_groupe_id', menu_groupe_id);
    if (modele?.id && lignes) {
      const rows = lignes.map((l) => ({
        modele_id: modele.id,
        mama_id,
        categorie: l.categorie,
        fiche_id: l.fiche_id,
        portions_par_personne: l.portions_par_personne,
        position: l.position,
      }));
      await supabase.from('menu_groupe_modele_lignes').insert(rows);
    }
    return modele;
  }

  async function exportExcel(menu_groupe_id) {
    return supabase.functions.invoke('menu_groupe_excel', { body: { id: menu_groupe_id } });
  }

  async function exportPdf(menu_groupe_id) {
    return supabase.functions.invoke('menu_groupe_pdf', { body: { id: menu_groupe_id } });
  }

  return {
    menus,
    fetchMenusGroupes,
    fetchMenuGroupeById,
    createMenuGroupe,
    updateMenuGroupe,
    addLigne,
    removeLigne,
    reorderLignes,
    setStatut,
    archiver,
    loadModele,
    saveAsModele,
    exportExcel,
    exportPdf,
  };
}
