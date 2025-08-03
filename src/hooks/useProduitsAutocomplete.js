// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

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
      .from("v_produits_dernier_prix")
      .select("id, nom, unite, tva")
      .eq("mama_id", mama_id)
      .eq("actif", true);
    if (query) q = q.ilike("nom", `%${query}%`);
    q = q.order("nom", { ascending: true }).limit(10);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    const { data: pmpData } = await supabase
      .from('v_pmp')
      .select('produit_id, pmp')
      .eq('mama_id', mama_id);
    const pmpMap = Object.fromEntries((pmpData || []).map(p => [p.produit_id, p.pmp]));
    const final = (Array.isArray(data) ? data : []).map(p => ({
      ...p,
      pmp: pmpMap[p.id] ?? 0,
    }));
    setResults(final);
    return final;
  }, [mama_id]);

  return { results, loading, error, searchProduits };
}
