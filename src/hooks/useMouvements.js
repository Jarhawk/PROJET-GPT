// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useMouvements() {
  const { mama_id } = useAuth();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getMouvements({ type = "", produit = "", zone = "", debut = "", fin = "" } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("mouvements_stock")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (type) query = query.eq("type", type);
    if (produit) query = query.eq("produit_id", produit);
    if (debut) query = query.gte("date", debut);
    if (fin) query = query.lte("date", fin);
    if (zone) query = query.ilike("zone", `%${zone}%`);

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
      .from("mouvements_stock")
      .insert([{ ...payload, mama_id }])
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
      .from("mouvements_stock")
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
