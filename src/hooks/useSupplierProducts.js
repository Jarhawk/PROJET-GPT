// src/hooks/useSupplierProducts.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Permet de récupérer tous les produits liés à un fournisseur (+ historique achats, PMP, etc.)
export function useSupplierProducts() {
  const { mama_id } = useAuth();

  // Tous les produits fournis par ce fournisseur (avec totaux achats/prix moyens)
  function getProductsBySupplier(fournisseur_id) {
    // Peut être asynchrone si tu veux charger en temps réel
    // Ou utiliser un state global pour garder cache
    // Ici on te propose le pattern async + hook si besoin
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("supplier_products")
        .select("*, product:products(nom, famille, unite), achats:invoices(date_facture, montant_total)")
        .eq("fournisseur_id", fournisseur_id)
        .eq("mama_id", mama_id);
      setProducts(data || []);
      setLoading(false);
      if (error) setError(error);
      return data || [];
    }

    return { products, loading, error, fetch };
  }

  return { getProductsBySupplier };
}
