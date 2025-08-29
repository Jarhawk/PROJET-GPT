// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
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
      const { data, error } = await supabase
        .from('produits')
        .select(
          `id, nom, famille_id, sous_famille_id,
           famille:familles!famille_id(nom),
           sous_famille:sous_familles!sous_famille_id(nom)`
        )
        .eq('mama_id', mama_id);

      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      setProducts(rows);
      return rows;
    } catch (err) {
      setError(err.message || "Erreur chargement produits enrichis.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return { products, loading, error, fetchEnrichedProducts };
}
