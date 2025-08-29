// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useProduitsAutocomplete() {
  const { mama_id } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProduits = useCallback(async (query = "") => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("produits")
      .select("id, nom, tva, dernier_prix, unite_id, unite:unite_id (nom)")
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .eq("unite.mama_id", mama_id);
    if (query) q = q.ilike("nom", `%${query}%`);
    q = q.order("nom", { ascending: true }).limit(10);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    const rows = Array.isArray(data) ? data : [];
    const final = [];
    for (const p of rows) {
      final.push({
        id: p.id,
        produit_id: p.id,
        nom: p.nom,
        unite_id: p.unite_id || "",
        unite: p.unite?.nom || "",
        tva: p.tva ?? 0,
        dernier_prix: p.dernier_prix ?? 0,
      });
    }
    setResults(final);
    return final;
  }, [mama_id]);

  return { results, loading, error, searchProduits };
}
