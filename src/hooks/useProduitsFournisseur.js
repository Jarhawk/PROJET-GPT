// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
export function useProduitsFournisseur() {
  const { mama_id } = useAuth();
  const [cache, setCache] = useState({});

  function useProduitsDuFournisseur(fournisseur_id) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetch() {
      if (!mama_id || !fournisseur_id) {
        setProducts([]);
        return [];
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("fournisseur_produits")
        .select(
          "*, produit:produit_id(id, nom, famille:familles:fk_produits_famille(id, nom), unite:unite_id(nom))"
        )
        .eq("fournisseur_id", fournisseur_id)
        .eq("mama_id", mama_id);
      setProducts(data || []);
      setLoading(false);
      if (error) setError(error);
      return data || [];
    }

    return { products, loading, error, fetch };
  }

  const getProduitsDuFournisseur = useCallback(
    async (fournisseur_id) => {
      if (!mama_id || !fournisseur_id) return [];
      if (cache[fournisseur_id]) return cache[fournisseur_id];
      const { data } = await supabase
        .from("fournisseur_produits")
        .select(
          "*, produit:produit_id(id, nom, famille:familles:fk_produits_famille(id, nom), unite:unite_id(nom))"
        )
        .eq("fournisseur_id", fournisseur_id)
        .eq("mama_id", mama_id);
      setCache((c) => ({ ...c, [fournisseur_id]: data || [] }));
      return data || [];
    },
    [mama_id, cache]
  );

  const countProduitsDuFournisseur = useCallback(
    async (fournisseur_id) => {
      if (!mama_id || !fournisseur_id) return 0;
      const { count } = await supabase
        .from("fournisseur_produits")
        .select("id", { count: "exact", head: true })
        .eq("fournisseur_id", fournisseur_id)
        .eq("mama_id", mama_id);
      return count || 0;
    },
    [mama_id]
  );

  return {
    useProduitsDuFournisseur,
    getProduitsDuFournisseur,
    countProduitsDuFournisseur,
  };
}
