import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export function useFournisseurApiConfig() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchConfig(fournisseur_id) {
    if (!mama_id || !fournisseur_id) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from('fournisseurs_api_config')
      .select('*')
      .eq('mama_id', mama_id)
      .eq('fournisseur_id', fournisseur_id)
      .maybeSingle();
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message || 'Erreur chargement configuration');
      return null;
    }
    return data;
  }

  async function saveConfig(fournisseur_id, config) {
    if (!mama_id || !fournisseur_id) return { error: 'missing context' };
    setLoading(true);
    const { data, error } = await supabase
      .from('fournisseurs_api_config')
      .upsert([{ ...config, fournisseur_id, mama_id }], {
        onConflict: ['fournisseur_id', 'mama_id'],
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message || 'Erreur sauvegarde configuration');
    }
    return { data, error };
  }

  async function deleteConfig(fournisseur_id) {
    if (!mama_id || !fournisseur_id) return { error: 'missing context' };
    setLoading(true);
    const { error } = await supabase
      .from('fournisseurs_api_config')
      .delete()
      .eq('fournisseur_id', fournisseur_id)
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message || 'Erreur suppression configuration');
    }
    return { error };
  }

  return { loading, error, fetchConfig, saveConfig, deleteConfig };
}
