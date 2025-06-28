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

  async function listConfigs({ fournisseur_id, actif, page = 1, limit = 20 } = {}) {
    if (!mama_id) return { data: [], count: 0, error: null };
    setLoading(true);
    let query = supabase
      .from('fournisseurs_api_config')
      .select('*', { count: 'exact' })
      .eq('mama_id', mama_id)
      .order('fournisseur_id');
    if (fournisseur_id) query = query.eq('fournisseur_id', fournisseur_id);
    if (actif !== undefined && actif !== null) query = query.eq('actif', actif);
    if (limit) query = query.range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message || 'Erreur chargement configurations');
      return { data: [], count: 0, error };
    }
    return { data, count, error: null };
  }

  return { loading, error, fetchConfig, saveConfig, deleteConfig, listConfigs };
}
