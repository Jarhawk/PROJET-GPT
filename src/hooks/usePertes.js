import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";

export function usePertes() {
  const { mama_id } = useAuth();
  const { log } = useAuditLog();
  const [pertes, setPertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchPertes({ debut = null, fin = null } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("pertes")
      .select("*, produit:product_id(nom)")
      .eq("mama_id", mama_id)
      .order("date_perte", { ascending: false });
    if (debut) query = query.gte("date_perte", debut);
    if (fin) query = query.lte("date_perte", fin);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setPertes(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function addPerte(values) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("pertes")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      await log("Ajout perte", values);
      await fetchPertes();
    }
  }

  async function updatePerte(id, values) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("pertes")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      await log("Modification perte", { id, ...values });
      await fetchPertes();
    }
  }

  async function deletePerte(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("pertes")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      await log("Suppression perte", { id });
      await fetchPertes();
    }
  }

  return { pertes, loading, error, fetchPertes, addPerte, updatePerte, deletePerte };
}
