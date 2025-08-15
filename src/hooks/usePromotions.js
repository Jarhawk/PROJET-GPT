// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function usePromotions() {
  const { mama_id } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchPromotions({ search = "", actif = null, page = 1, limit = 20 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("promotions")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date_debut", { ascending: false });
    if (typeof query.range === "function") {
      query = query.range((page - 1) * limit, page * limit - 1);
    }
    if (search) query = query.ilike("nom", `%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    const { data, error, count } = await query;
    setPromotions(Array.isArray(data) ? data : []);
    setTotal(count || 0);
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
    total,
    loading,
    error,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
  };
}
