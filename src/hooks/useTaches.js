// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useTaches() {
  const { mama_id } = useAuth();
  const [taches, setTaches] = useState([]);

  const fetchTaches = useCallback(
    async (filtres = {}) => {
      if (!mama_id) return [];
      let q = supabase
        .from('taches')
        .select('id, titre, description, assignes, date_echeance, statut, utilisateur_id, mama_id')
        .eq('mama_id', mama_id);
      if (filtres.statut) q = q.eq('statut', filtres.statut);
      if (filtres.utilisateur) q = q.contains('assignes', [filtres.utilisateur]);
      if (filtres.start) q = q.gte('date_echeance', filtres.start);
      if (filtres.end) q = q.lte('date_echeance', filtres.end);
      const { data } = await q;
      const rows = Array.isArray(data) ? data : [];
      setTaches(rows);
      return rows;
    },
    [mama_id]
  );

  const createTache = useCallback(
    async values => {
      if (!mama_id) return {};
      const { assignes = [], ...tache } = values;
      const { data } = await supabase
        .from('taches')
        .insert([{ ...tache, assignes, mama_id }])
        .select('id, titre, description, assignes, date_echeance, statut, utilisateur_id, mama_id')
        .single();
      return data;
    },
    [mama_id]
  );

  const deleteTache = useCallback(
    async id => {
      await supabase
        .from('taches')
        .update({ actif: false })
        .eq('id', id)
        .eq('mama_id', mama_id);
    },
    [mama_id]
  );

  return { taches, fetchTaches, createTache, deleteTache };
}

export default useTaches;

