// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCostCenterSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSuggestions(product_id) {
    if (!product_id) {
      setSuggestions([]);
      return [];
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("suggest_cost_centers", { p_produit_id: product_id });
    setLoading(false);
    if (error) {
      setError(error);
      setSuggestions([]);
      return [];
    }
    setSuggestions(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { suggestions, loading, error, fetchSuggestions };
}
