// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useTacheAssignation() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignUsers = useCallback(
    async (tacheId, userIds = []) => {
      if (!mama_id) return {};
      setLoading(true);
      setError(null);
      const list = Array.isArray(userIds) ? userIds : [];
      const rows = [];
      for (const uid of list) {
        rows.push({ tache_id: tacheId, utilisateur_id: uid, mama_id });
      }
      const { error } = await supabase.from("tache_assignations").insert(rows);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      return {};
    },
    [mama_id]
  );

  const unassignUser = useCallback(
    async (tacheId, userId) => {
      if (!mama_id) return {};
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from("tache_assignations")
        .delete()
        .eq("tache_id", tacheId)
        .eq("utilisateur_id", userId)
        .eq("mama_id", mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      return {};
    },
    [mama_id]
  );

  return { assignUsers, unassignUser, loading, error };
}

export default useTacheAssignation;
