// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useCallback } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook retournant le comparatif des prix par fournisseur pour un produit donné.
 * Calcule le dernier prix connu, le nombre d'achats et le prix moyen (PMP).
 */
export function useComparatif(productId) {
  const { mama_id } = useAuth();
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparatif = useCallback(async (id = productId) => {
    if (!id || !mama_id) {
      setLignes([]);
      return [];
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fournisseur_produits")
      .select("prix_achat, date_livraison, fournisseur_id, fournisseur:fournisseur_id(nom)")
      .eq("produit_id", id)
      .eq("mama_id", mama_id)
      .order("date_livraison", { ascending: false });

    if (error) {
      setError(error);
      setLignes([]);
      setLoading(false);
      return [];
    }

    const grouped = {};
    for (const row of data || []) {
      const fid = row.fournisseur_id;
      if (!grouped[fid]) {
        grouped[fid] = {
          fournisseur: row.fournisseur?.nom || "-",
          dernierPrix: parseFloat(row.prix_achat),
          total: parseFloat(row.prix_achat),
          nb: 1,
        };
      } else {
        grouped[fid].nb += 1;
        grouped[fid].total += parseFloat(row.prix_achat);
      }
    }

    const lignesRes = Object.values(grouped).map((l) => ({
      fournisseur: l.fournisseur,
      dernierPrix: l.dernierPrix,
      nb: l.nb,
      pmp: l.total / l.nb,
    }));

    setLignes(lignesRes);
    setLoading(false);
    return lignesRes;
  }, [mama_id, productId]);

  useEffect(() => {
    if (productId && mama_id) {
      fetchComparatif(productId);
    } else {
      setLignes([]);
    }
  }, [productId, mama_id, fetchComparatif]);

  return { lignes, loading, error, fetchComparatif };
}
