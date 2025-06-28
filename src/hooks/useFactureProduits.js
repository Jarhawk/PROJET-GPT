// src/hooks/useFactureProduits.js
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInvoiceLines } from "./useInvoiceLines";

export function useFactureProduits() {
  const { mama_id } = useAuth();
  const {
    fetchLines,
    addLine,
    updateLine,
    deleteLine,
  } = useInvoiceLines();
  const [produitsFacture, setProduitsFacture] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchProduitsByFacture(facture_id) {
    if (!facture_id || !mama_id) return [];
    setLoading(true);
    setError(null);
    const data = await fetchLines(facture_id);
    setProduitsFacture(data);
    setLoading(false);
    return data;
  }

  return {
    produitsFacture,
    loading,
    error,
    fetchProduitsByFacture,
    addLine,
    updateLine,
    deleteLine,
  };
}
