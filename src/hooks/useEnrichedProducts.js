// src/hooks/useEnrichedProducts.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useEnrichedProducts() {
  const { mama_id } = useAuth(); // ✅ remplacement correct
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mama_id) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("mama_id", mama_id);

        if (error) throw error;

        setProduits(data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [mama_id]);

  return { produits, loading, error };
}
