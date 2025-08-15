// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
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
        .from('help_articles')
        .select('*')
        .eq('mama_id', mama_id)
        .order('created_at', { ascending: false });
      if (filters.categorie) query = query.eq('categorie', filters.categorie);
      if (filters.lien_page) query = query.eq('lien_page', filters.lien_page);
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
      const { data, error } = await supabase
        .from('help_articles')
        .insert([{ ...values, mama_id }])
        .select()
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setItems((arr) => [data, ...arr]);
      return { data };
    },
    [mama_id]
  );

  const updateArticle = useCallback(
    async (id, values) => {
      if (!mama_id || !id) return { error: 'missing id' };
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('help_articles')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select()
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setItems((arr) => arr.map((a) => (a.id === id ? data : a)));
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
        .from('help_articles')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setItems((arr) => arr.filter((a) => a.id !== id));
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
