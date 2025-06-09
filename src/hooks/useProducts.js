// src/hooks/useProducts.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProducts({ search = "", famille = "", actif = true }) {
  const [produits, setProduits] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProduits = async (mama_id) => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select(
          "id, nom, famille, unite, actif, stock_theorique, dernier_prix" // pmp retiré
        )
        .eq("mama_id", mama_id);

      if (actif !== null) query = query.eq("actif", actif);
      if (famille) query = query.ilike("famille", `%${famille}%`);
      if (search) query = query.ilike("nom", `%${search}%`);

      const { data, error } = await query;

      if (error) throw error;
      setProduits(data || []);

      // Extraire les familles uniques
      const uniqueFamilles = [...new Set(data.map((p) => p.famille).filter(Boolean))];
      setFamilles(uniqueFamilles);
    } catch (err) {
      console.error("❌ Erreur fetchProduits :", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    produits,
    familles,
    loading,
    fetchProduits,
  };
}
