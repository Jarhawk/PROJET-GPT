import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useDebounce from './useDebounce';
import { useMultiMama } from '@/context/MultiMamaContext';
import { logSupaError } from '@/lib/supa/logError';

export default function useProductSearch(initialQuery = '') {
  const supabase = useSupabaseClient();
  const { mamaActif: currentMamaId } = useMultiMama();
  const [query, setQuery] = useState(initialQuery);
  const debounced = useDebounce(query.trim(), 300);

  const { data, isFetching, error } = useQuery({
    queryKey: ['product-search', currentMamaId, debounced],
    enabled: !!debounced,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produits')
        .select('id, nom, stock_reel, pmp')
        .ilike('nom', `%${debounced}%`)
        .eq('mama_id', currentMamaId)
        .limit(20)
        .order('nom', { ascending: true });
      if (error) {
        logSupaError('produits', error);
        throw error;
      }
      return data ?? [];
    },
  });

  return { query, setQuery, results: data, isLoading: isFetching, error };
}
