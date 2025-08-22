// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
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

export function useUnites() {
  const { mama_id } = useAuth();
  const queryClient = safeQueryClient();
  const [params, setParams] = useState({ search: '', page: 1, limit: 50 });

  const query = useQuery({
    queryKey: ['unites', mama_id, params],
    enabled: !!mama_id,
    queryFn: async () => {
      let q = supabase
        .from('unites')
        .select('id, code, nom, actif', { count: 'exact' })
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true })
        .range((params.page - 1) * params.limit, params.page * params.limit - 1);
      if (params.search) q = q.ilike('nom', `%${params.search}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const fetchUnites = useCallback(
    (p = {}) => setParams((prev) => ({ ...prev, ...p })),
    []
  );

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const body = typeof payload === 'string' ? { nom: payload } : payload;
      const { data, error } = await supabase
        .from('unites')
        .insert([{ ...body, mama_id }])
        .select('id, code, nom, actif')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['unites', mama_id]),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('unites')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select('id, code, nom, actif')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['unites', mama_id]),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('unites')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['unites', mama_id]),
  });

  return {
    unites: query.data?.data || [],
    total: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error,
    fetchUnites,
    addUnite: (payload) => addMutation.mutateAsync(payload),
    updateUnite: (id, payload) => updateMutation.mutateAsync({ id, ...payload }),
    deleteUnite: (id) => deleteMutation.mutateAsync(id),
  };
}

export default useUnites;

// export minimal for importExcelProduits
export async function fetchUnitesForValidation(mama_id) {
  const { data, error } = await supabase
    .from('unites')
    .select('id, nom')
    .eq('mama_id', mama_id)
    .order('nom', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
