import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useStock() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger stock (avec valorisation en direct)
  const fetchStocks = useCallback(async () => {
    if (!user?.mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("mama_id", user.mama_id);
    setLoading(false);
    if (error) setError(error);
    setStocks(data || []);
    return data;
  }, [user?.mama_id]);

  // 2. Charger mouvements stock
  const fetchMouvements = useCallback(async () => {
    if (!user?.mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("mouvements_stock")
      .select("*")
      .eq("mama_id", user.mama_id)
      .order("date", { ascending: false });
    setLoading(false);
    if (error) setError(error);
    setMouvements(data || []);
    return data;
  }, [user?.mama_id]);

  // 3. Ajouter mouvement de stock
  async function addMouvementStock({ product_id, type, quantite, zone, motif }) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("mouvements_stock").insert([{
      product_id,
      type,
      quantite: Number(quantite),
      zone,
      motif,
      mama_id: user?.mama_id,
      date: new Date().toISOString(),
    }]);
    setLoading(false);
    if (error) setError(error);
    // On ne met pas à jour ici, c’est fait au fetchStocks/fetchMouvements
  }

  async function fetchRotationStats(product_id) {
    const { data, error } = await supabase.rpc('stats_rotation_produit', {
      mama_id_param: user?.mama_id,
      product_id_param: product_id,
    });
    if (error) return [];
    return data || [];
  }

  return {
    stocks,
    mouvements,
    loading,
    error,
    fetchStocks,
    fetchMouvements,
    addMouvementStock,
    fetchRotationStats,
  };
}
