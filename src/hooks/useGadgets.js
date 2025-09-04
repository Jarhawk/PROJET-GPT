import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useGadgets() {
  const { mama_id, user_id } = useAuth();
  const [gadgets, setGadgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGadgets = useCallback(async () => {
    if (!mama_id || !user_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('tableaux_de_bord')
      .select('liste_gadgets_json')
      .eq('utilisateur_id', user_id)
      .eq('mama_id', mama_id)
      .single();
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setGadgets([]);
      return [];
    }
    const list = data?.liste_gadgets_json || [];
    setGadgets(list);
    return list;
  }, [mama_id, user_id]);

  const saveGadgets = useCallback(
    async (list) => {
      if (!mama_id || !user_id) return null;
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from('tableaux_de_bord')
        .upsert(
          { utilisateur_id: user_id, mama_id, liste_gadgets_json: list },
          { onConflict: 'utilisateur_id,mama_id' }
        );
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return null;
      }
      setGadgets(list);
      return list;
    },
    [mama_id, user_id]
  );

  const addGadget = useCallback(
    async (gadget) => {
      if (!mama_id) return null;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('gadgets')
        .insert([{ ...gadget, mama_id }])
        .select()
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  const updateGadget = useCallback(
    async (id, values) => {
      if (!id || !mama_id) return null;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('gadgets')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select()
        .single();
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  const deleteGadget = useCallback(
    async (id) => {
      if (!id || !mama_id) return;
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from('gadgets')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
      }
    },
    [mama_id]
  );

  return {
    gadgets,
    loading,
    error,
    fetchGadgets,
    saveGadgets,
    addGadget,
    updateGadget,
    deleteGadget,
  };
}
