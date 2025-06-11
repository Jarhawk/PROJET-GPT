import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useComparatif() {
  const { mama_id } = useAuth();
  const [comparatif, setComparatif] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchComparatif() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("comparatif")
        .select("*")
        .eq("mama_id", mama_id);

      if (error) throw error;
      setComparatif(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erreur de chargement du comparatif.");
      setComparatif([]);
    } finally {
      setLoading(false);
    }
  }

  return { comparatif, loading, error, fetchComparatif };
}
