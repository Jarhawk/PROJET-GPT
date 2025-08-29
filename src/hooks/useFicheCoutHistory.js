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
        .select("id, mama_id, fiche_id, old_cout, new_cout, changed_by, changed_at, created_at, updated_at, actif")
        .eq("fiche_id", fiche_id)
        .eq("mama_id", mama_id)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      const rows = [];
      if (Array.isArray(data)) {
        for (const d of data) {
          rows.push({
            ...d,
            old_cout: d.old_cout ? Number(d.old_cout) : null,
            new_cout: d.new_cout ? Number(d.new_cout) : null,
          });
        }
      }
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
