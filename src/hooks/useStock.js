// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

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

  // 2. Charger mouvements stock
  const fetchMouvements = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("stock_mouvements")
      .select(
        "*, zone_source:zones_stock!stock_mouvements_zone_source_id_fkey(id, nom), zone_destination:zones_stock!stock_mouvements_zone_destination_id_fkey(id, nom)"
      )
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) setError(error);
    setMouvements(data || []);
    return data;
  }, [mama_id]);

  // 3. Ajouter mouvement de stock
  async function addMouvementStock({
    produit_id,
    type,
    quantite,
    zone_source_id = null,
    zone_destination_id = null,
    commentaire = "",
  }) {
    setLoading(true);
    setError(null);
    const payload = {
      produit_id,
      type,
      quantite: Number(quantite),
      mama_id,
      date: new Date().toISOString(),
      commentaire,
    };
    if (type === "entree") {
      payload.zone_destination_id = zone_destination_id ?? zone_source_id;
    } else if (type === "sortie") {
      payload.zone_source_id = zone_source_id ?? zone_destination_id;
    } else if (type === "transfert") {
      payload.zone_source_id = zone_source_id;
      payload.zone_destination_id = zone_destination_id;
    }
    const { error } = await supabase.from("stock_mouvements").insert([payload]);
    setLoading(false);
    if (error) setError(error);
    // Les listes seront rafraîchies via fetchStocks/fetchMouvements
  }

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
    [mama_id, user_id]
  );

  const createMouvement = useCallback(
    async (payload) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("stock_mouvements")
        .insert([{ ...payload, mama_id, auteur_id: user_id }])
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
