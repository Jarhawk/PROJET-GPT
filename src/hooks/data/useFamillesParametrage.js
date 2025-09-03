import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useFamillesParametrage({ mamaId, enabled = true }) {
  return useQuery({
    queryKey: ['param-familles', { mamaId }],
    enabled: !!mamaId && enabled,
    queryFn: async () => {
      // Ne pas sélectionner "code" pour éviter 400 si la colonne n'existe pas
      const { data, error } = await supabase
        .from('familles')
        .select('id, nom, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    initialData: [],
    staleTime: 10_000,
    keepPreviousData: true,
  });
}
