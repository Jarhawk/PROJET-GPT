import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFournisseurStats() {
  const { mama_id } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchFournisseurStats(fournisseur_id) {
    setLoading(true);
    setError(null);
    try {
      // Exemple : agrégation des factures du fournisseur, total achats, etc.
      const { data, error } = await supabase
        .from("factures")
        .select("id, montant, date")
        .eq("mama_id", mama_id)
        .eq("fournisseur_id", fournisseur_id);

      if (error) throw error;
      // Statistiques simples
      const totalAchats = Array.isArray(data)
        ? data.reduce((sum, f) => sum + (Number(f.montant) || 0), 0)
        : 0;
      const nbFactures = Array.isArray(data) ? data.length : 0;
      setStats({ totalAchats, nbFactures, factures: data || [] });
    } catch (err) {
      setError(err.message || "Erreur récupération stats fournisseur.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, error, fetchFournisseurStats };
}
