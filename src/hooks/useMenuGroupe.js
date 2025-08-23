import supabase from '@/lib/supabase';

export default function useMenuGroupe() {
  async function fetchMenusGroupes({ q } = {}) {
    let qy = supabase.from('menu_groupes').select('*');
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
