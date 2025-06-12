// src/hooks/useFactureProduits.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFactureProduits() {
  const { mama_id } = useAuth();
  const [produitsFacture, setProduitsFacture] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchProduitsByFacture(facture_id) {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("facture_lignes")
      .select("*, produit: products(nom, famille, unite)")
      .eq("facture_id", facture_id)
      .eq("mama_id", mama_id);
    setProduitsFacture(data || []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  return { produitsFacture, loading, error, fetchProduitsByFacture };
}
