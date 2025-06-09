// src/hooks/useFiches.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useFiches = ({ tri = "nom" } = {}) => {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFiches = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, nom, portions, cout_total, created_at")
        .eq("mama_id", mama_id);

      if (error) throw error;

      const sorted = (data || []).sort((a, b) => {
        if (tri === "nom") return a.nom.localeCompare(b.nom);
        if (tri === "date") return new Date(b.created_at) - new Date(a.created_at);
        return 0;
      });

      setFiches(sorted);
    } catch (err) {
      console.error("❌ Erreur chargement fiches :", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mama_id) fetchFiches();
  }, [mama_id, tri]);

  return { fiches, loading, error, refetch: fetchFiches };
};

export default useFiches;
