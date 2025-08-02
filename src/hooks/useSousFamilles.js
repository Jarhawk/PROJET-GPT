// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSousFamilles = useCallback(
    async (familleId) => {
      if (!mama_id || !familleId) {
        setSousFamilles([]);
        return [];
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("sous_familles")
        .select("id, nom, famille_id")
        .eq("mama_id", mama_id)
        .eq("actif", true)
        .eq("famille_id", familleId)
        .order("nom", { ascending: true });
      if (error) {
        setError(error);
        setSousFamilles([]);
      } else {
        setSousFamilles(Array.isArray(data) ? data : []);
      }
      setLoading(false);
      return data || [];
    },
    [mama_id]
  );

  return { sousFamilles, loading, error, fetchSousFamilles, setSousFamilles };
}
