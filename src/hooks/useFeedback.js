// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useFeedback() {
  const { mama_id, user_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeedback = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setItems([]);
      return [];
    }
    setItems(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  const addFeedback = useCallback(
    async (values) => {
      if (!mama_id || !user_id) return { error: "Aucun utilisateur" };
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from("feedback")
        .insert([{ ...values, mama_id, user_id, actif: true }]);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      await fetchFeedback();
      return { success: true };
    },
    [mama_id, user_id, fetchFeedback]
  );

  return { items, loading, error, fetchFeedback, addFeedback };
}

