// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useSousFamilles({ mamaId, familleId, enabled = true }) {
  return useQuery({
    queryKey: ['sous-familles', { mamaId, familleId }],
    enabled: !!mamaId && enabled,
    queryFn: async () => {
      let q = supabase
        .from('sous_familles')
        .select('id, nom, famille_id, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });

      if (familleId) q = q.eq('famille_id', familleId);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
    keepPreviousData: true,
    initialData: [],
  });
}

