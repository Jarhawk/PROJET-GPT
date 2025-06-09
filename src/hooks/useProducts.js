// src/hooks/useProducts.js
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook pour récupérer la liste des produits de l'établissement connecté.
 * Tous les appels sont automatiquement filtrés par mama_id via le contexte Auth.
 */
export function useProducts({ search = "", famille = "", actif = true } = {}) {
  const { mama_id } = useAuth();
  const [produits, setProduits] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduits = useCallback(async () => {
    if (!mama_id) {
      setProduits([]);
      setFamilles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("products")
        .select(
          "id, nom, famille, unite, actif, stock_theorique, dernier_prix"
        )
        .eq("mama_id", mama_id);

      if (actif !== null) query = query.eq("actif", actif);
      if (famille) query = query.ilike("famille", `%${famille}%`);
      if (search) query = query.ilike("nom", `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      setProduits(data || []);
      const uniqueFamilles = [
        ...new Set((data || []).map((p) => p.famille).filter(Boolean)),
      ];
      setFamilles(uniqueFamilles);
    } catch (err) {
      console.error("❌ Erreur fetchProduits :", err);
      setError(err);
      setProduits([]);
    } finally {
      setLoading(false);
    }
  }, [mama_id, search, famille, actif]);

  // Chargement initial et rafraîchissement automatique lors d'un changement des paramètres
  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  return {
    data: produits,
    produits, // FR alias
    products: produits, // legacy alias
    familles,
    loading,
    error,
    fetchProduits,
    refetch: fetchProduits,
  };
}

export default useProducts;
