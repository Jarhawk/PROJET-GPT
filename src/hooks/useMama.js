// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useMama() {
  const { mama_id } = useAuth();
  const [mama, setMama] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchMama() {
    if (!mama_id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("mamas")
      .select("*")
      .eq("id", mama_id)
      .single();
    if (!error) setMama(data);
    setError(error);
    setLoading(false);
    return data;
  }

  async function updateMama(fields) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("mamas")
      .update(fields)
      .eq("id", mama_id);
    setError(error);
    setLoading(false);
    if (!error) await fetchMama();
  }

  return { mama, loading, error, fetchMama, updateMama };
}
