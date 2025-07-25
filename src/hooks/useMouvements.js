// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useMouvements() {
  const { mama_id, user_id } = useAuth();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getMouvements({ type = "", produit = "", zone_source = "", zone_destination = "", debut = "", fin = "" } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("stock_mouvements")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (type) query = query.eq("type", type);
    if (produit) query = query.eq("produit_id", produit);
    if (debut) query = query.gte("date", debut);
    if (fin) query = query.lte("date", fin);
    if (zone_source) query = query.eq("zone_source_id", zone_source);
    if (zone_destination) query = query.eq("zone_destination_id", zone_destination);

    const { data, error } = await query;
    if (!error) setMouvements(data || []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function createMouvement(payload) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("stock_mouvements")
      .insert([{ ...payload, mama_id, auteur_id: user_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setMouvements(m => [data, ...m]);
    return { data };
  }

  async function deleteMouvement(id) {
    if (!id || !mama_id) return { error: "no id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("stock_mouvements")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setMouvements(m => m.filter(row => row.id !== id));
    return { data: true };
  }

  return { mouvements, loading, error, getMouvements, createMouvement, deleteMouvement };
}

export default useMouvements;
