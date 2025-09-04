// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';

export function useTacheAssignation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignUsers = useCallback(async (tacheId, userIds = []) => {
    setLoading(true);
    setError(null);
    const rows = userIds.map(uid => ({ tache_id: tacheId, utilisateur_id: uid }));
    const { error } = await supabase.from("utilisateurs_taches").insert(rows);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return { error };
    }
    return {};
  }, []);

  const unassignUser = useCallback(async (tacheId, userId) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("utilisateurs_taches")
      .delete()
      .eq("tache_id", tacheId)
      .eq("utilisateur_id", userId);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return { error };
    }
    return {};
  }, []);

  return { assignUsers, unassignUser, loading, error };
}

export default useTacheAssignation;
