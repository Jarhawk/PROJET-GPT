// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useFamilles({ mamaId, enabled = true }) {
  return useQuery({
    queryKey: ['familles', { mamaId }],
    enabled: !!mamaId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('familles')
        .select('id, nom, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
    keepPreviousData: true,
    initialData: [],
  });
}

