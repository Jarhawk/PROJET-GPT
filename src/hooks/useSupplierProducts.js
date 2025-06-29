// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
export function useSupplierProducts() {
  const { mama_id } = useAuth();
  const [cache, setCache] = useState({});

  function useProductsBySupplier(fournisseur_id) {
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
        .from("supplier_products")
        .select(
        "*, product:products(nom, famille, unite), achats:factures(date_facture:date, numero_facture:reference, montant_total:total_ttc)"
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

  async function getProductsBySupplier(fournisseur_id) {
    if (!mama_id || !fournisseur_id) return [];
    if (cache[fournisseur_id]) return cache[fournisseur_id];
    const { data } = await supabase
      .from("supplier_products")
      .select(
        "*, product:products(nom, famille, unite), achats:factures(date_facture:date, numero_facture:reference, montant_total:total_ttc)"
      )
      .eq("fournisseur_id", fournisseur_id)
      .eq("mama_id", mama_id);
    setCache(c => ({ ...c, [fournisseur_id]: data || [] }));
    return data || [];
  }

  async function countProductsBySupplier(fournisseur_id) {
    if (!mama_id || !fournisseur_id) return 0;
    const { count } = await supabase
      .from("supplier_products")
      .select("id", { count: "exact", head: true })
      .eq("fournisseur_id", fournisseur_id)
      .eq("mama_id", mama_id);
    return count || 0;
  }

  return { useProductsBySupplier, getProductsBySupplier, countProductsBySupplier };
}
