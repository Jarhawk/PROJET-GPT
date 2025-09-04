// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useCallback } from "react";

import { useAuth } from '@/hooks/useAuth';

export function useCarte() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCarte = useCallback(
    async (type) => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase.
      from("fiches_techniques").
      select("*").
      eq("mama_id", mama_id).
      eq("carte_actuelle", true).
      order("nom", { ascending: true });
      if (type) query = query.eq("type_carte", type);
      const { data, error } = await query;
      setLoading(false);
      if (error) {
        setError(error);
        return [];
      }
      return Array.isArray(data) ? data : [];
    },
    [mama_id]
  );

  const updatePrixVente = useCallback(
    async (id, prix_vente) => {
      if (!mama_id) return;
      const { error } = await supabase.
      from("fiches_techniques").
      update({ prix_vente }).
      eq("id", id).
      eq("mama_id", mama_id);
      if (error) throw error;
    },
    [mama_id]
  );

  const toggleCarte = useCallback(
    async (id, active, extra = {}) => {
      if (!mama_id) return;
      const { error } = await supabase.
      from("fiches_techniques").
      update({ carte_actuelle: active, ...extra }).
      eq("id", id).
      eq("mama_id", mama_id);
      if (error) throw error;
    },
    [mama_id]
  );

  return { loading, error, fetchCarte, updatePrixVente, toggleCarte };
}