// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useStock() {
  const { mama_id, user_id } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger stock (avec valorisation en direct)
  const fetchStocks = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    setStocks(data || []);
    return data;
  }, [mama_id]);

  // 2. Charger mouvements stock
  const fetchMouvements = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("mouvements_stock")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });
    setLoading(false);
    if (error) setError(error);
    setMouvements(data || []);
    return data;
  }, [mama_id]);

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
      mama_id,
      date: new Date().toISOString(),
    }]);
    setLoading(false);
    if (error) setError(error);
    // On ne met pas à jour ici, c’est fait au fetchStocks/fetchMouvements
  }

  async function fetchRotationStats(product_id) {
    const { data, error } = await supabase.rpc('stats_rotation_produit', {
      mama_id_param: mama_id,
      product_id_param: product_id,
    });
    if (error) return [];
    return data || [];
  }

  // ----- New helpers for stock module -----
  const getStockTheorique = useCallback(
      async (product_id) => {
        if (!mama_id || !product_id) return 0;
        const { data, error } = await supabase
          .from("products")
          .select("stock_theorique")
          .eq("mama_id", mama_id)
          .eq("id", product_id)
          .single();
      if (error) return 0;
      return data?.stock_theorique ?? 0;
    },
    [mama_id]
  );

  const getInventaires = useCallback(async () => {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("inventaires")
      .select("*, utilisateurs:created_by(email)")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });
    if (error) return [];
    return data || [];
  }, [mama_id]);

  const createInventaire = useCallback(
    async (payload) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("inventaires")
        .insert([{ ...payload, mama_id, created_by: user_id }])
        .select()
        .single();
      if (error) return null;
      return data;
    },
    [mama_id, user_id]
  );

  const createMouvement = useCallback(
    async (payload) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("mouvements_stock")
        .insert([{ ...payload, mama_id, created_by: user_id }])
        .select()
        .single();
      if (error) return null;
      return data;
    },
    [mama_id, user_id]
  );

  return {
    stocks,
    mouvements,
    loading,
    error,
    fetchStocks,
    fetchMouvements,
    addMouvementStock,
    fetchRotationStats,
    getStockTheorique,
    getInventaires,
    createInventaire,
    createMouvement,
  };
}
