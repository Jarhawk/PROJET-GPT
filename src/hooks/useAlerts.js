import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useAlerts() {
  const { mama_id } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRules = useCallback(async ({ search = "", actif = null } = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("alert_rules")
      .select("*, product:products(id, nom)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (typeof actif === "boolean") query = query.eq("enabled", actif);
    if (search) query = query.ilike("product.nom", `%${search}%`);

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setRules([]);
      return [];
    }
    setRules(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  async function addRule(values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("alert_rules")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  async function updateRule(id, values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("alert_rules")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  async function deleteRule(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("alert_rules")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  return { rules, loading, error, fetchRules, addRule, updateRule, deleteRule };
}
