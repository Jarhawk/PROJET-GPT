import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useMenuGroupe() {
  const { mama_id } = useAuth();

  async function fetchMenusGroupes({ q } = {}) {
    if (!mama_id) return [];
    let qy = supabase.from('menus').select('id, nom, date, actif')
      .eq('mama_id', mama_id);
    if (q) qy = qy.ilike('nom', `%${q}%`);
    const { data, error } = await qy;
    if (error) return [];
    return Array.isArray(data) ? data : [];
  }

  async function addLigne(menuId, ligne) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('menu_fiches')
      .insert([{ ...ligne, menu_id: menuId, mama_id }]);
    return { error };
  }

  return { fetchMenusGroupes, addLigne };
}

