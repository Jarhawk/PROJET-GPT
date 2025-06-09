// src/hooks/useFournisseurs.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFournisseurs = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, nom, email, ville, actif, created_at")
        .eq("mama_id", mama_id)
        .order("nom", { ascending: true });

      if (error) throw error;

      setData(data || []);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des fournisseurs :", err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mama_id) fetchFournisseurs();
  }, [mama_id]);

  return { data, loading, error, refetch: fetchFournisseurs };
}

export default useFournisseurs;
