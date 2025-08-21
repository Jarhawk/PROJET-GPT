import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { resolveAlertesRuptureSource } from '@/lib/resolveAlertesRuptureSource';

export async function fetchAlertesRupture(mamaId) {
  try {
    const source = await resolveAlertesRuptureSource(supabase);
    const { data, error } = await supabase
      .from(source)
      // embed grâce à la FK alertes_rupture.produit_id -> produits.id
      .select(
        'id, mama_id, produit_id, stock_actuel, traite, cree_le, produit:produits(id,nom)'
      )
      .eq('mama_id', mamaId)
      .is('traite', false)
      .order('cree_le', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
    toast.error(error.message || 'Erreur récupération alertes rupture');
    return [];
  }
}

