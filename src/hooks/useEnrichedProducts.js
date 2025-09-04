// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState } from "react";

import { useAuth } from '@/hooks/useAuth';

export function useEnrichedProducts() {
  const { mama_id } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchEnrichedProducts() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.
      from("produits").
      select(
        "id, nom, famille_id, sous_famille_id, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom), liaisons:fournisseur_produits!fournisseur_produits_produit_id_fkey(*, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(*))"
      ).
      eq("mama_id", mama_id);

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