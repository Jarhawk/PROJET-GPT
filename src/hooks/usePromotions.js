import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function usePromotions() {
  const { mama_id } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchPromotions({ search = "", actif = null } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("promotions")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_debut", { ascending: false });
    if (search) query = query.ilike("nom", `%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    const { data, error } = await query;
    setPromotions(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error.message || error);
    return data || [];
  }

  async function addPromotion(values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("promotions")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) setError(error.message || error);
    await fetchPromotions();
  }

  async function updatePromotion(id, values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("promotions")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error.message || error);
    await fetchPromotions();
  }

  async function deletePromotion(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("promotions")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error.message || error);
    await fetchPromotions();
  }

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
  };
}
