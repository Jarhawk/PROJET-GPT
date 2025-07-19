// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
      .order("date_demande", { ascending: false });
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
      .insert([{ ...values, mama_id, demandeur_id: user.id, actif: true }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchRequests();
  }

  async function fetchRequestById(id) {
    if (!mama_id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("validation_requests")
      .select("*")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return null;
    }
    return data;
  }

  async function updateStatus(id, status) {
    if (!mama_id || !user) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("validation_requests")
      .update({ statut: status, valideur_id: user.id, date_validation: new Date().toISOString() })
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

  return { items, loading, error, fetchRequests, fetchRequestById, addRequest, updateStatus };
}
