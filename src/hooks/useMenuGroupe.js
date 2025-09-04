import supabase from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useMenuGroupe() {
  const { mama_id } = useAuth();

  async function fetchMenusGroupes({ q } = {}) {
    if (!mama_id) return [];
    let qy = supabase.from('menu_groupes').select('*').eq('mama_id', mama_id);
    if (q) qy = qy.ilike('nom', `%${q}%`);
    const { data } = await qy;
    return data || [];
  }

  async function addLigne(menuGroupeId, ligne) {
    return supabase
      .from('menu_groupes_lignes')
      .insert([{ ...ligne, menu_groupe_id: menuGroupeId }]);
  }

  return { fetchMenusGroupes, addLigne };
}

export { useMenuGroupe as useAuth };
