// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useValidations() {
  const { mama_id, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchRequests() {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("validation_requests")
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
  }

  async function addRequest(values) {
    if (!mama_id || !user) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("validation_requests")
      .insert([{ ...values, mama_id, requested_by: user.id, actif: true }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchRequests();
  }

  async function updateStatus(id, status) {
    if (!mama_id || !user) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("validation_requests")
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("mama_id", mama_id)
      .eq("actif", true);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchRequests();
  }

  return { items, loading, error, fetchRequests, addRequest, updateStatus };
}
