// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

function safeQueryClient() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryClient();
  } catch {
    return {
      invalidateQueries: () => {},
      setQueryData: () => {},
      fetchQuery: async () => {},
    };
  }
}

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const queryClient = safeQueryClient();
  const [params, setParams] = useState({ search: '', actif: undefined, familleId: undefined });

  const query = useQuery({
    queryKey: ['sous_familles', mama_id, params],
    enabled: !!mama_id,
    queryFn: async () => {
      let q = supabase
        .from('sous_familles')
        .select('id, code, nom, actif, famille_id, familles(nom)')
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true });
      if (params.search) q = q.ilike('nom', `%${params.search}%`);
      if (typeof params.actif === 'boolean') q = q.eq('actif', params.actif);
      if (params.familleId) q = q.eq('famille_id', params.familleId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const list = useCallback(
    (p = {}) => setParams((prev) => ({ ...prev, ...p })),
    []
  );

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const body = { ...payload, mama_id };
      const { data, error } = await supabase
        .from('sous_familles')
        .insert([body])
        .select('id, code, nom, actif, famille_id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['sous_familles', mama_id]),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('sous_familles')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select('id, code, nom, actif, famille_id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['sous_familles', mama_id]),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('sous_familles')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['sous_familles', mama_id]),
  });

  const toggleActif = useCallback(
    (id, actif) => updateMutation.mutateAsync({ id, actif }),
    [updateMutation]
  );

  return {
    sousFamilles: query.data || [],
    loading: query.isLoading,
    error: query.error,
    list,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, ...payload }),
    toggleActif,
    remove: (id) => deleteMutation.mutateAsync(id),
  };
}

export default useSousFamilles;
