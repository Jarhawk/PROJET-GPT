import supabase from '@/lib/supabaseClient';

export async function fetchAlertesRupture(mamaId) {

    const { data, error } = await supabase
    .from('alertes_rupture')
    // embed grâce à la FK alertes_rupture.produit_id -> produits.id
    .select('id, mama_id, produit_id, traite, cree_le, produit:produits(id,nom)')
    .eq('mama_id', mamaId)
    .is('traite', false)
    .order('cree_le', { ascending: false });

  if (error) throw error;
  return data;
}

