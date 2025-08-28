import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useMenuGroupe() {
  const { mama_id } = useAuth();

  async function fetchMenusGroupes({ q } = {}) {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from('menus')
      .select('id, nom, date, actif')
      .eq('mama_id', mama_id);
    if (error) return [];
    const rows = Array.isArray(data) ? data : [];
    if (q) {
      const qLower = q.toLowerCase();
      return rows.filter((m) => typeof m.nom === 'string' && m.nom.toLowerCase().includes(qLower));
    }
    return rows;
  }

  async function addLigne(menuId, ligne) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { fiche_id, actif } = ligne || {};
    const payload = { fiche_id, menu_id: menuId, mama_id };
    if (typeof actif === 'boolean') payload.actif = actif;
    const { error } = await supabase.from('menu_fiches').insert([payload]);
    return { error };
  }

  return { fetchMenusGroupes, addLigne };
}

