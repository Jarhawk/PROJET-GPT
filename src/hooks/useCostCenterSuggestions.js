// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function useCostCenterSuggestions() {
  const { mama_id } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSuggestions(produit_id) {
    if (!produit_id) {
      setSuggestions([]);
      return [];
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc(
      "suggest_cost_centers",
      { p_produit_id: produit_id, p_mama_id: mama_id }
    );
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
