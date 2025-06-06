import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFamilles() {
  const { mama_id } = useAuth();
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFamilles = async () => {
    if (!mama_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("familles")
      .select("nom")
      .eq("mama_id", mama_id)
      .order("nom");

    if (error) {
      console.error("Erreur chargement familles :", error.message);
      setFamilles([]);
    } else {
      const unique = [...new Set(data.map((item) => item.nom))];
      setFamilles(unique);
    }
    setLoading(false);
  };

  const addFamille = async (nom) => {
    if (!mama_id || !nom) return;
    const { error } = await supabase
      .from("familles")
      .insert([{ nom, mama_id }]);
    if (error) console.error("Erreur ajout famille :", error.message);
    else await fetchFamilles();
  };

  useEffect(() => {
    fetchFamilles();
  }, [mama_id]);

  return { familles, addFamille, loading, fetchFamilles };
}
