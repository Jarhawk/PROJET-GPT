// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
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
      const { data, error: fpErr } = await supabase
        .from('fournisseur_produits')
        .select('id, produit_id, fournisseur_id, prix_achat, actif, date_livraison, mama_id')
        .eq('fournisseur_id', fournisseur_id)
        .eq('mama_id', mama_id);

      if (fpErr) {
        setError(fpErr);
        setProducts([]);
        setLoading(false);
        return [];
      }

      const rows = Array.isArray(data) ? data : [];
      const ids = Array.from(new Set(rows.map(r => r.produit_id).filter(Boolean)));
      let produitsMap = {};
      if (ids.length) {
        const { data: produits, error: pErr } = await supabase
          .from('produits')
          .select('id, nom, unite_id, famille_id, sous_famille_id, mama_id')
          .eq('mama_id', mama_id)
          .in('id', ids);
        if (pErr) {
          setError(pErr);
        } else {
          for (const p of Array.isArray(produits) ? produits : []) {
            produitsMap[p.id] = p;
          }
        }
      }

      const enriched = rows.map(r => ({ ...r, produit: produitsMap[r.produit_id] || null }));
      setProducts(enriched);
      setLoading(false);
      return enriched;
    }

    return { products, loading, error, fetch };
  }

  const getProduitsDuFournisseur = useCallback(
    async (fournisseur_id) => {
      if (!mama_id || !fournisseur_id) return [];
      if (cache[fournisseur_id]) return cache[fournisseur_id];

      const { data, error } = await supabase
        .from('fournisseur_produits')
        .select('id, produit_id, fournisseur_id, prix_achat, actif, date_livraison, mama_id')
        .eq('fournisseur_id', fournisseur_id)
        .eq('mama_id', mama_id);

      if (error) return [];

      const rows = Array.isArray(data) ? data : [];
      const ids = Array.from(new Set(rows.map(r => r.produit_id).filter(Boolean)));
      let produitsMap = {};
      if (ids.length) {
        const { data: produits, error: pErr } = await supabase
          .from('produits')
          .select('id, nom, unite_id, famille_id, sous_famille_id, mama_id')
          .eq('mama_id', mama_id)
          .in('id', ids);
        if (!pErr) {
          for (const p of Array.isArray(produits) ? produits : []) {
            produitsMap[p.id] = p;
          }
        }
      }

      const enriched = rows.map(r => ({ ...r, produit: produitsMap[r.produit_id] || null }));
      setCache(c => ({ ...c, [fournisseur_id]: enriched }));
      return enriched;
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
