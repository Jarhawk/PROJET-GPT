import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useEnrichedProducts() {
  const { mama_id } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchEnrichedProducts() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          suppliers:supplier_products(*, fournisseur: fournisseurs(*))
        `)
        .eq("mama_id", mama_id);

      if (error) throw error;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erreur chargement produits enrichis.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return { products, loading, error, fetchEnrichedProducts };
}
