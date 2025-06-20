import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function usePlanning() {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchPlanning({ start, end } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("planning_previsionnel")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_prevue", { ascending: true });
    if (start) query = query.gte("date_prevue", start);
    if (end) query = query.lte("date_prevue", end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setItems([]);
      return [];
    }
    setItems(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function addPlanning(values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("planning_previsionnel")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchPlanning();
  }

  async function updatePlanning(id, values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("planning_previsionnel")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchPlanning();
  }

  async function deletePlanning(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("planning_previsionnel")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchPlanning();
  }

  return {
    items,
    loading,
    error,
    fetchPlanning,
    addPlanning,
    updatePlanning,
    deletePlanning,
  };
}
