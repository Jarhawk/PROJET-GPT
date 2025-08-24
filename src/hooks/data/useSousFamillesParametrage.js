import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useSousFamillesParametrage({ mamaId, search = '', familleId, statut = 'all' }) {
  return useQuery({
    queryKey: ['param-sous-familles', { mamaId, search, familleId, statut }],
    enabled: !!mamaId,
    queryFn: async () => {
      let q = supabase
        .from('sous_familles')
        .select('id, nom, actif, famille_id, mama_id')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });

      if (search?.trim()) q = q.ilike('nom', `%${search.trim()}%`);
      if (familleId) q = q.eq('famille_id', familleId);
      if (statut === 'actifs') q = q.eq('actif', true);
      if (statut === 'inactifs') q = q.eq('actif', false);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    initialData: [],
    staleTime: 5_000,
    keepPreviousData: true,
  });
}
