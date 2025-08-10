// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from "@/hooks/useAuditLog";

export function useMouvementCostCenters() {
  const { mama_id } = useAuth();
  const { log } = useAuditLog();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchAllocations(mouvement_id) {
    if (!mouvement_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("mouvements_centres_cout")
      .select("id, mouvement_id, cost_center_id, quantite, valeur, centres_de_cout:cost_center_id(nom)")
      .eq("mouvement_id", mouvement_id)
      .eq("mama_id", mama_id)
      .order("created_at");
    setLoading(false);
    if (error) {
      setError(error);
      setAllocations([]);
      return [];
    }
    setAllocations(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function saveAllocations(mouvement_id, rows) {
    if (!mouvement_id) return;
    setLoading(true);
    setError(null);
    await supabase
      .from("mouvements_centres_cout")
      .delete()
      .eq("mouvement_id", mouvement_id)
      .eq("mama_id", mama_id);
    const prepared = (rows || []).map(r => ({
      mouvement_id,
      cost_center_id: r.cost_center_id,
      quantite: Number(r.quantite) || 0,
      valeur: r.valeur ? Number(r.valeur) : null,
      mama_id,
    }));
    if (prepared.length > 0) {
      const { error } = await supabase
        .from("mouvements_centres_cout")
        .insert(prepared);
      if (error) setError(error);
    }
    setLoading(false);
    await fetchAllocations(mouvement_id);
    await log("Ventilation mouvement", { mouvement_id, rows: prepared });
  }

  return { allocations, loading, error, fetchAllocations, saveAllocations };
}
