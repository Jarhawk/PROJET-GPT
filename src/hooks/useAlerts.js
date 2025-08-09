// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

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
      .from("regles_alertes")
      .select("*, produit:produit_id(id, nom)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (typeof actif === "boolean") query = query.eq("actif", actif);
    if (search) query = query.ilike("produit.nom", `%${search}%`);

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
      .from("regles_alertes")
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
      .from("regles_alertes")
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
      .from("regles_alertes")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  const fetchAlerts = useCallback(async (type = null, traite = null) => {
    if (!mama_id) return [];
    let query = supabase
      .from("alertes_rupture")
      .select("*, produit:produit_id(id, nom)")
      .eq("mama_id", mama_id)
      .order("cree_le", { ascending: false });
    if (type) query = query.eq("type", type);
    if (typeof traite === "boolean") query = query.eq("traite", traite);
    const { data } = await query;
    return data || [];
  }, [mama_id]);

  const markAsHandled = useCallback(async (id) => {
    if (!mama_id) return;
    await supabase
      .from("alertes_rupture")
      .update({ traite: true })
      .eq("id", id)
      .eq("mama_id", mama_id);
  }, [mama_id]);

  const generateSuggestions = useCallback(async () => {
    if (!mama_id) return [];
    const res = await fetch("/functions/v1/generatePurchaseSuggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mama_id }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.suggestions || [];
  }, [mama_id]);

  return {
    rules,
    loading,
    error,
    fetchRules,
    addRule,
    updateRule,
    deleteRule,
    fetchAlerts,
    markAsHandled,
    generateSuggestions,
  };
}
