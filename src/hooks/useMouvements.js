// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import usePeriodes from "@/hooks/usePeriodes";

export function useMouvements() {
  const { mama_id, user_id } = useAuth();
  const { checkCurrentPeriode } = usePeriodes();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMouvements = useCallback(
    async (
      { type = "", produit = "", zone = "", debut = "", fin = "" } = {}
    ) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase
        .from("stock_mouvements")
        .select(
          "id, date, type, quantite, zone_id, motif, produits:produit_id(nom, unite)"
        )
        .eq("mama_id", mama_id)
        .order("date", { ascending: false });

      if (type) query = query.eq("type", type);
      if (produit) query = query.eq("produit_id", produit);
      if (zone) query = query.eq("zone_id", zone);
      if (debut) query = query.gte("date", debut);
      if (fin) query = query.lte("date", fin);

      const { data, error } = await query;
      if (!error) setMouvements(data || []);
      setLoading(false);
      if (error) setError(error);
      return data || [];
    },
    [mama_id]
  );

  const createMouvement = useCallback(
    async payload => {
      if (!mama_id) return { error: "no mama_id" };
      const date = payload.date || new Date().toISOString();
      const { error: pErr } = await checkCurrentPeriode(date);
      if (pErr) return { error: pErr };
      setLoading(true);
      setError(null);
      const toInsert = {
        ...payload,
        date,
        mama_id,
        auteur_id: user_id,
      };
      if (payload.motif) {
        toInsert.commentaire = payload.motif;
        delete toInsert.motif;
      }
      const { data, error } = await supabase
        .from("stock_mouvements")
        .insert([toInsert])
        .select()
        .single();
      setLoading(false);
      if (error) {
        setError(error);
        return { error };
      }
      setMouvements(m => [data, ...m]);
      return { data };
    },
    [mama_id, user_id, checkCurrentPeriode]
  );

  return { mouvements, loading, error, fetchMouvements, createMouvement };
}

export default useMouvements;
