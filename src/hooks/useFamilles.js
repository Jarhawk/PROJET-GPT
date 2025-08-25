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

export function useFamilles() {
  const { mama_id } = useAuth();
  const queryClient = safeQueryClient();
  const [params, setParams] = useState({ search: '', page: 1, limit: 50 });

  const query = useQuery({
    queryKey: ['familles', mama_id, params],
    enabled: !!mama_id,
    queryFn: async () => {
      let q = supabase
        .from('familles')
        .select('id, nom, actif', { count: 'exact' })
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true })
        .range((params.page - 1) * params.limit, params.page * params.limit - 1);
      if (params.search) q = q.ilike('nom', `%${params.search}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const fetchFamilles = useCallback(
    (p = {}) => setParams((prev) => ({ ...prev, ...p })),
    []
  );

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const body = { ...payload, mama_id };
      const { data, error } = await supabase
        .from('familles')
        .insert([body])
        .select('id, nom, actif')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['familles', mama_id]),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('familles')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select('id, nom, actif')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['familles', mama_id]),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('familles')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['familles', mama_id]),
  });

  const batchDeleteFamilles = async (ids = []) => {
    await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
  };

  return {
    familles: query.data?.data || [],
    total: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error,
    fetchFamilles,
    addFamille: (payload) => addMutation.mutateAsync(payload),
    updateFamille: (id, payload) => updateMutation.mutateAsync({ id, ...payload }),
    deleteFamille: (id) => deleteMutation.mutateAsync(id),
    batchDeleteFamilles,
  };
}

// export minimal attendu par importExcelProduits.js
export async function fetchFamillesForValidation(supabase, mama_id) {
  const { data, error } = await supabase
    .from('familles')
    .select('id, nom, actif')
    .eq('mama_id', mama_id)
    .order('nom', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default useFamilles;
