import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import useDebounce from './useDebounce';
import { useMultiMama } from '@/context/MultiMamaContext';

export default function useProductSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const supabase = useSupabaseClient();
  const { mamaActif: currentMamaId } = useMultiMama();

  const debounced = useDebounce(query.trim(), 250);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('produits')
        .select('id, nom, pmp')
        .ilike('nom', `%${debounced}%`)
        .eq('mama_id', currentMamaId)
        .limit(50)
        .order('nom', { ascending: true });

      if (error) {
        console.error('[useProductSearch] error', error);
        throw error;
      }

      return data ?? [];
    } catch (err) {
      console.error('[useProductSearch] failed to fetch products', err);
      throw err;
    }
  };

  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product-search', currentMamaId, debounced],
    queryFn: fetchProducts,
    enabled: !!currentMamaId && debounced.length > 0,
    staleTime: 0,
    gcTime: 0,
  });

  return { query, setQuery, results, isLoading, error };
}

