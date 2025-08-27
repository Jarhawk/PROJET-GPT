// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useAide() {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(
    async (filters = {}) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase
        .from('documentation')
        .select('id, titre, contenu, categorie, created_at, mama_id')
        .eq('mama_id', mama_id)
        .order('created_at', { ascending: false });
      if (filters.categorie) query = query.eq('categorie', filters.categorie);
      if (filters.search) query = query.ilike('titre', `%${filters.search}%`);
      const { data, error } = await query;
      setLoading(false);
      if (error) {
        setError(error.message || error);
        setItems([]);
        return [];
      }
      setItems(Array.isArray(data) ? data : []);
      return data || [];
    },
    [mama_id]
  );

  const addArticle = useCallback(
    async (values) => {
      if (!mama_id) return { error: 'missing mama_id' };
      setLoading(true);
      setError(null);
      const { titre, contenu, categorie } = values || {};
      const payload = { titre, contenu, categorie, mama_id };
      const { data, error } = await supabase
        .from('documentation')
        .insert([payload])
        .select('id, titre, contenu, categorie, created_at, mama_id')
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setItems((arr) => {
        if (Array.isArray(arr)) {
          return [data, ...arr];
        }
        return [data];
      });
      return { data };
    },
    [mama_id]
  );

  const updateArticle = useCallback(
    async (id, values) => {
      if (!mama_id || !id) return { error: 'missing id' };
      setLoading(true);
      setError(null);
      const { titre, contenu, categorie } = values || {};
      const update = { titre, contenu, categorie };
      const { data, error } = await supabase
        .from('documentation')
        .update(update)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select('id, titre, contenu, categorie, created_at, mama_id')
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setItems((arr) => {
        if (Array.isArray(arr)) {
          return arr.map((a) => (a.id === id ? data : a));
        }
        return [];
      });
      return { data };
    },
    [mama_id]
  );

  const deleteArticle = useCallback(
    async (id) => {
      if (!mama_id || !id) return { error: 'missing id' };
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setItems((arr) => {
        if (Array.isArray(arr)) {
          return arr.filter((a) => a.id !== id);
        }
        return [];
      });
      return { success: true };
    },
    [mama_id]
  );

  return {
    items,
    loading,
    error,
    fetchArticles,
    addArticle,
    updateArticle,
    deleteArticle,
  };
}
