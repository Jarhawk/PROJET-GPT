// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useStock() {
  const { mama_id } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger stock (avec valorisation en direct)
  const fetchStocks = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("produits")
      .select(
        "id, nom, unite_id, unite:unite_id (nom), stock_reel, stock_min, pmp, famille_id, sous_famille_id, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom)"
      )
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    setStocks(data || []);
    return data;
  }, [mama_id]);

  async function fetchRotationStats(produit_id) {
    const { data, error } = await supabase.rpc('stats_rotation_produit', {
      mama_id_param: mama_id,
      produit_id_param: produit_id,
    });
    if (error) return [];
    return data || [];
  }

  // ----- New helpers for stock module -----
  const getStockTheorique = useCallback(
    async (produit_id) => {
      if (!mama_id || !produit_id) return 0;
      const { data, error } = await supabase
        .from("v_stocks")
        .select("stock")
        .eq("mama_id", mama_id)
        .eq("produit_id", produit_id)
        .single();
      if (error) return 0;
      return data?.stock ?? 0;
    },
    [mama_id]
  );

  const getInventaires = useCallback(async () => {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("inventaires")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_inventaire", { ascending: false });
    if (error) return [];
    return data || [];
  }, [mama_id]);

  const createInventaire = useCallback(
    async (payload) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("inventaires")
        .insert([{ ...payload, mama_id }])
        .select()
        .single();
      if (error) return null;
      return data;
    },
    [mama_id]
  );

  return {
    stocks,
    loading,
    error,
    fetchStocks,
    fetchRotationStats,
    getStockTheorique,
    getInventaires,
    createInventaire,
  };
}
