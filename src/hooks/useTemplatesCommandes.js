// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const columns =
  'id, mama_id, nom, fournisseur_id, logo_url, entete, pied_page, adresse_livraison, contact_nom, contact_tel, contact_email, conditions_generales, champs_visibles, actif, created_at, updated_at';

export async function getTemplatesCommandesActifs(mama_id) {
  if (!mama_id) return { data: [], error: null };
  const { data, error } = await supabase
    .from('templates_commandes')
    .select(columns)
    .eq('actif', true)
    .eq('mama_id', mama_id)
    .order('nom');
  return { data: Array.isArray(data) ? data : [], error };
}

export function useTemplatesCommandes() {
  const { mama_id } = useAuth();

  const fetchTemplates = async ({ fournisseur_id } = {}) => {
    if (!mama_id) return { data: [], error: null };
    let query = supabase
      .from('templates_commandes')
      .select(`${columns}, fournisseur:fournisseur_id(id, nom)`) // join on real FK
      .eq('mama_id', mama_id)
      .order('nom');
    if (fournisseur_id) query = query.eq('fournisseur_id', fournisseur_id);
    const { data, error } = await query;
    return { data: Array.isArray(data) ? data : [], error };
  };

  const getTemplateForFournisseur = async (fournisseur_id) => {
    if (!mama_id) return { data: null, error: 'mama_id manquant' };
    const { data, error } = await supabase
      .rpc('get_template_commande', { p_mama: mama_id, p_fournisseur: fournisseur_id })
      .single();
    return { data, error };
  };

  return {
    fetchTemplates,

    fetchTemplateById: async (id) => {
      if (!mama_id) return { data: null, error: null };
      const { data, error } = await supabase
        .from('templates_commandes')
        .select(`${columns}, fournisseur:fournisseur_id(id, nom)`)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .single();
      return { data, error };
    },

    createTemplate: async (payload) => {
      if (!mama_id) return { data: null, error: 'mama_id manquant' };
      const { data, error } = await supabase
        .from('templates_commandes')
        .insert({ ...payload, mama_id })
        .select(columns)
        .single();
      return { data, error };
    },

    updateTemplate: async (id, payload) => {
      if (!mama_id) return { data: null, error: 'mama_id manquant' };
      const { data, error } = await supabase
        .from('templates_commandes')
        .update(payload)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select(columns)
        .single();
      return { data, error };
    },

    deleteTemplate: async (id) => {
      if (!mama_id) return { error: 'mama_id manquant' };
      const { error } = await supabase
        .from('templates_commandes')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      return { error };
    },

    getTemplateForFournisseur,
  };
}

export default useTemplatesCommandes;

