// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth"; // ✅ Correction Codex

export function useCostCenterSuggestions() {
  const { mama_id } = useAuth(); // ✅ Correction Codex
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSuggestions(produit_id) { // ✅ Correction Codex
    if (!produit_id) { // ✅ Correction Codex
      setSuggestions([]);
      return [];
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc(
      "suggest_cost_centers",
      { p_produit_id: produit_id, p_mama_id: mama_id }
    ); // ✅ Correction Codex
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
