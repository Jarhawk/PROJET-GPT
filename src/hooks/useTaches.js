// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useTaches() {
  const { mama_id } = useAuth();
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('v_taches_assignees')
      .select('*')
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return [];
    }
    setTaches(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  const createTache = useCallback(
    async (tache, assignees = []) => {
      if (!mama_id) return { error: 'no_mama' };
      setLoading(true);
      setError(null);
      const { error: tacheError } = await supabase
        .from('taches')
        .insert([{ ...tache, mama_id }]);
      if (tacheError) {
        setLoading(false);
        setError(tacheError.message || tacheError);
        return { error: tacheError };
      }
      if (assignees.length > 0) {
        const rows = assignees.map(uid => ({
          tache_id: tache.id,
          user_id: uid,
          mama_id,
        }));
        const { error: assignError } = await supabase
          .from('utilisateurs_taches')
          .insert(rows);
        if (assignError) {
          setLoading(false);
          setError(assignError.message || assignError);
          return { error: assignError };
        }
      }
      setLoading(false);
      await fetchAssignments();
      return {};
    },
    [mama_id, fetchAssignments]
  );

  const deleteTache = useCallback(
    async id => {
      setLoading(true);
      setError(null);
      await supabase
        .from('utilisateurs_taches')
        .delete()
        .eq('tache_id', id)
        .eq('mama_id', mama_id);
      const { error } = await supabase
        .from('taches')
        .update({ actif: false })
        .eq('id', id)
        .eq('mama_id', mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      await fetchAssignments();
      return {};
    },
    [mama_id, fetchAssignments]
  );

  return {
    taches,
    loading,
    error,
    fetchAssignments,
    createTache,
    deleteTache,
  };
}

export default useTaches;

