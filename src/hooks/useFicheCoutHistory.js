// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useFicheCoutHistory() {
  const { mama_id } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchFicheCoutHistory(fiche_id) {
    if (!fiche_id || !mama_id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("fiche_cout_history")
        .select("*")
        .eq("fiche_id", fiche_id)
        .eq("mama_id", mama_id)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      const rows = Array.isArray(data)
        ? data.map((d) => ({
            ...d,
            cout_portion: d.cout_portion ? Number(d.cout_portion) : null,
            prix_vente: d.prix_vente ? Number(d.prix_vente) : null,
          }))
        : [];
      setHistory(rows);
    } catch (err) {
      setError(err.message || "Erreur chargement historique coût fiche.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  return { history, loading, error, fetchFicheCoutHistory };
}
