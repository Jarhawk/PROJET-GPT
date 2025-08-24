// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 25;

export function useProduits({ mamaId, search = '', statut = 'all', familleId, sousFamilleId, page = 1 }) {
  const offset = (page - 1) * PAGE_SIZE;
  const key = useMemo(
    () => ['produits', { mamaId, search, statut, familleId, sousFamilleId, page }],
    [mamaId, search, statut, familleId, sousFamilleId, page]
  );

  return useQuery({
    queryKey: key,
    enabled: !!mamaId,
    queryFn: async () => {
      let q = supabase
        .from('produits')
        .select('id, nom, unite, pmp, actif, zone_stockage, famille_id, sous_famille_id', { count: 'exact' })
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (search?.trim()) q = q.ilike('nom', `%${search.trim()}%`);
      if (statut === 'actifs') q = q.eq('actif', true);
      if (statut === 'inactifs') q = q.eq('actif', false);
      if (familleId) q = q.eq('famille_id', familleId);
      if (sousFamilleId) q = q.eq('sous_famille_id', sousFamilleId);

      const { data, error, count } = await q;
      if (error) throw error;

      return { rows: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE };
    },
    keepPreviousData: true,
    staleTime: 10_000,
  });
}

