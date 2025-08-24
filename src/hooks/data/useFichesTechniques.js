// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import useMamaSettings from '@/hooks/useMamaSettings';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Chargement paginé des fiches techniques depuis la table `fiches`.
 * Filtres possibles: recherche par nom, famille, statut (actif/inactif/tous).
 */
export function useFichesTechniques({
  search = '',
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  famille = null,
  statut = 'tous', // 'tous' | 'actif' | 'inactif'
  sortBy = 'nom',
}) {
  const { mamaId } = useMamaSettings();

  return useQuery({
    queryKey: ['fiches', { mamaId, search, page, pageSize, famille, statut, sortBy }],
    enabled: !!mamaId,
    keepPreviousData: true,
    staleTime: 10_000,
    queryFn: async () => {
      let q = supabase
        .from('fiches_techniques')
        .select(
          'id, nom, actif, cout_par_portion, portions, famille, prix_vente, type_carte, sous_type_carte, carte_actuelle, cout_total, rendement, created_at, updated_at',
          { count: 'exact' },
        )
        .eq('mama_id', mamaId)
        .order(sortBy, { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) q = q.ilike('nom', `%${search}%`);
      if (famille) q = q.eq('famille', famille);
      if (statut === 'actif') q = q.eq('actif', true);
      if (statut === 'inactif') q = q.eq('actif', false);

      const { data, error, count } = await q;
      if (error) throw error;

      return { rows: data ?? [], total: count ?? 0 };
    },
  });
}

