import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supa/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Récupère les familles pour un mama donné.
 * Retourne un objet { data: [] } pour éviter les accès undefined.
 */
export async function fetchFamilles(mamaId) {
  const { data, error } = await supabase
    .from('familles')
    .select('id, nom, actif, mama_id')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true });

  if (error) {
    console.warn('[fetchFamilles] fallback []', error);
    return { data: [] };
  }
  return { data: data ?? [] };
}

export function useFamilles() {
  const { mama_id } = useAuth();
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);

  const list = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const { data } = await fetchFamilles(mama_id);
    setFamilles(data ?? []);
    setLoading(false);
    return data;
  }, [mama_id]);

  const addFamille = useCallback(
    async (values) => {
      if (!mama_id) return;
      await supabase.from('familles').insert([{ ...values, mama_id }]);
      return list();
    },
    [mama_id, list]
  );

  const updateFamille = useCallback(
    async (id, values) => {
      if (!mama_id) return;
      await supabase.from('familles').update(values).match({ id, mama_id });
      return list();
    },
    [mama_id, list]
  );

  const deleteFamille = useCallback(
    async (id) => {
      if (!mama_id) return;
      await supabase.from('familles').delete().match({ id, mama_id });
      return list();
    },
    [mama_id, list]
  );

  const batchDeleteFamilles = useCallback(
    async (ids) => {
      if (!mama_id || !ids?.length) return;
      await supabase.from('familles').delete().in('id', ids).eq('mama_id', mama_id);
      return list();
    },
    [mama_id, list]
  );

  useEffect(() => {
    list();
  }, [list]);

  return {
    familles,
    fetchFamilles: list,
    addFamille,
    updateFamille,
    deleteFamille,
    batchDeleteFamilles,
    loading,
  };
}

export const fetchFamillesForValidation = fetchFamilles;

export default useFamilles;
