// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import useAuth from "@/hooks/useAuth";

export async function fetchSousFamilles(mama_id, familleId) {
  const { data, error } = await supabase
    .from("sous_familles")
    .select("id, nom, famille_id, position, actif")
    .eq("mama_id", mama_id)
    .eq("famille_id", familleId)
    .order("position", { ascending: true });
  if (error) throw error;
  const { data: stats } = await supabase
    .from("v_sous_familles_stats")
    .select("sous_famille_id, nb_produits")
    .eq("mama_id", mama_id)
    .eq("famille_id", familleId);
  const map = new Map((stats || []).map((s) => [s.sous_famille_id, s.nb_produits]));
  return (data || []).map((sf) => ({ ...sf, nb_produits: map.get(sf.id) || 0 }));
}

export async function createSousFamille(
  { famille_id, nom, actif = true, position = 0 },
  mama_id
) {
  return await supabase
    .from("sous_familles")
    .insert([{ famille_id, nom, actif, position, mama_id }]);
}

export async function updateSousFamille(id, payload, mama_id) {
  return await supabase
    .from("sous_familles")
    .update(payload)
    .match({ id, mama_id });
}

export async function deleteSousFamille(id, mama_id) {
  return await supabase.from("sous_familles").delete().match({ id, mama_id });
}

export async function mergeSousFamilles(srcId, dstId) {
  return await supabase.rpc("merge_sous_familles", { src: srcId, dst: dstId });
}

export async function reorderSousFamilles(familleId, rows) {
  return await supabase.rpc("reorder_sous_familles", {
    p_famille: familleId,
    p_rows: rows,
  });
}

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSousFamilles = useCallback(
    async (familleId) => {
      if (!mama_id || !familleId) {
        setSousFamilles([]);
        return [];
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("sous_familles")
        .select("id, nom, famille_id")
        .eq("mama_id", mama_id)
        .eq("actif", true)
        .eq("famille_id", familleId)
        .order("nom", { ascending: true });
      if (error) {
        setError(error);
        setSousFamilles([]);
      } else {
        setSousFamilles(Array.isArray(data) ? data : []);
      }
      setLoading(false);
      return data || [];
    },
    [mama_id]
  );

  return { sousFamilles, loading, error, fetchSousFamilles, setSousFamilles };
}
