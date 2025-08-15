// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useTasks() {
  const { mama_id } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("taches")
      .select(
        "*, assigned:utilisateurs!taches_assigned_to_fkey(nom)"
      )
      .eq("mama_id", mama_id)
      .order("next_echeance", { ascending: true });
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    setTasks(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  const fetchTaskById = useCallback(async (id) => {
    if (!mama_id || !id) return null;
    const { data, error } = await supabase
      .from("taches")
      .select(
        "*, assigned:utilisateurs!taches_assigned_to_fkey(nom)"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setError(error.message);
      return null;
    }
    return data;
  }, [mama_id]);

  const fetchTasksByStatus = useCallback(async (statut) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("taches")
      .select(
        "*, assigned:utilisateurs!taches_assigned_to_fkey(nom)"
      )
      .eq("mama_id", mama_id);
    if (statut) query = query.eq("statut", statut);
    const { data, error } = await query.order("next_echeance", { ascending: true });
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data || [];
  }, [mama_id]);

  const addTask = useCallback(async (values) => {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("taches")
      .insert([{ ...values, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return { error };
    }
    await fetchTasks();
    return data;
  }, [mama_id, fetchTasks]);

  const updateTask = useCallback(async (id, values) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("taches")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return { error };
    }
    await fetchTasks();
    return data;
  }, [mama_id, fetchTasks]);

  const deleteTask = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("taches")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return { error };
    }
    await fetchTasks();
    return {};
  }, [mama_id, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTaskById,
    fetchTasksByStatus,
    addTask,
    updateTask,
    deleteTask,
  };
}
