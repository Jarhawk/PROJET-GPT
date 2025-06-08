import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useUnites() {
  const { mama_id } = useAuth();
  const [suggestions, setSuggestions] = useState([]);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("unites")
      .select("nom")
      .eq("mama_id", mama_id);

    if (!error && data) {
      setSuggestions([...new Set(data.map((d) => d.nom).filter(Boolean))]);
    }
  }, [mama_id]);

  const addUnite = useCallback(async (nom) => {
    if (!nom) return;
    await supabase.from("unites").insert({ nom, mama_id });
    fetch();
  }, [fetch, mama_id]);

  useEffect(() => {
    if (mama_id) fetch();
  }, [mama_id, fetch]);

  return { suggestions, addUnite };
}
