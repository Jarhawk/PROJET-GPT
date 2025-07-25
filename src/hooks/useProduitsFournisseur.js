// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
export function useProduitsFournisseur() { // ✅ Correction Codex
  const { mama_id } = useAuth();
  const [cache, setCache] = useState({});

  function useProduitsDuFournisseur(fournisseur_id) { // ✅ Correction Codex
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
          "*, produit:produits(id, nom, famille:familles(nom), unite:unites(nom)), achats:factures(date_facture, numero, total_ttc)"
        )
        .eq("fournisseur_id", fournisseur_id)
        .eq("mama_id", mama_id);
      setProducts(data || []);
      setLoading(false);
      if (error) setError(error);
      return data || [];
    }

    return { products, loading, error, fetch }; // ✅ Correction Codex (no rename for object keys to keep usage)
  }

  async function getProduitsDuFournisseur(fournisseur_id) { // ✅ Correction Codex
    if (!mama_id || !fournisseur_id) return [];
    if (cache[fournisseur_id]) return cache[fournisseur_id];
    const { data } = await supabase
      .from("fournisseur_produits")
      .select(
        "*, produit:produits(id, nom, famille:familles(nom), unite:unites(nom)), achats:factures(date_facture, numero, total_ttc)"
      )
      .eq("fournisseur_id", fournisseur_id)
      .eq("mama_id", mama_id);
    setCache(c => ({ ...c, [fournisseur_id]: data || [] }));
    return data || [];
  }

  async function countProduitsDuFournisseur(fournisseur_id) { // ✅ Correction Codex
    if (!mama_id || !fournisseur_id) return 0;
    const { count } = await supabase
      .from("fournisseur_produits")
      .select("id", { count: "exact", head: true })
      .eq("fournisseur_id", fournisseur_id)
      .eq("mama_id", mama_id);
    return count || 0;
  }

  return { // ✅ Correction Codex
    useProduitsDuFournisseur,
    getProduitsDuFournisseur,
    countProduitsDuFournisseur,
  };
}
