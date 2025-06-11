import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useStock() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger stock (avec valorisation en direct)
  async function fetchStocks() {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("products")
      .select("*"); // Ajoute les champs utiles stock_reel, pmp, unite, zone

    if (user?.mama_id) query = query.eq("mama_id", user.mama_id);

    const { data, error } = await query;
    setLoading(false);
    if (error) setError(error);
    setStocks(data || []);
    return data;
  }

  // 2. Charger mouvements stock
  async function fetchMouvements() {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("mouvements_stock")
      .select("*")
      .order("date", { ascending: false });
    if (user?.mama_id) query = query.eq("mama_id", user.mama_id);
    const { data, error } = await query;
    setLoading(false);
    if (error) setError(error);
    setMouvements(data || []);
    return data;
  }

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

  return {
    stocks,
    mouvements,
    loading,
    error,
    fetchStocks,
    fetchMouvements,
    addMouvementStock,
  };
}
