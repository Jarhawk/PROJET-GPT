// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

/**
 * Chargement paginé des fiches techniques sans jointures cassées.
 * Récupère d'abord les fiches avec leur `famille_id`, puis charge les familles
 * correspondantes et merge côté front pour exposer `famille_nom`.
 */
export function useFichesTechniques({
  page = 1,
  search = '',
  actif = 'true',
  famille,
  sortBy = 'nom',
  mamaId,
}) {
  const offset = (page - 1) * PAGE_SIZE;

  // Clef de cache STABLE
  const queryKey = useMemo(
    () => [
      'fiches-techniques',
      { page, search, actif, famille, sortBy, mamaId },
    ],
    [page, search, actif, famille, sortBy, mamaId],
  );

  return useQuery({
    queryKey,
    // On ne lance la requête que si on connaît la mama
    enabled: !!mamaId,
    queryFn: async () => {
      // 1) FICHES sans join familles
      let q = supabase
        .from('fiches_techniques')
        .select(
          'id, nom, actif, cout_par_portion, famille_id, created_at, updated_at',
          { count: 'exact' },
        )
        .eq('mama_id', mamaId)
        .order(sortBy, { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (search?.trim()) q = q.ilike('nom', `%${search.trim()}%`);
      if (actif === 'true') q = q.eq('actif', true);
      if (actif === 'false') q = q.eq('actif', false);
      if (famille) q = q.eq('famille_id', famille);

      const { data: fiches = [], error, count } = await q;
      if (error) throw error;

      // 2) Récup familles si besoin
      const familleIds = [...new Set(fiches.map((f) => f.famille_id).filter(Boolean))];
      let famillesById = {};
      if (familleIds.length) {
        const { data: familles = [], error: famErr } = await supabase
          .from('familles')
          .select('id, nom')
          .in('id', familleIds);

        if (famErr) {
          // On ne jette pas, on renvoie juste sans les noms
          console.warn('Chargement familles échoué:', famErr);
        } else {
          famillesById = Object.fromEntries(familles.map((f) => [f.id, f]));
        }
      }

      // 3) Merge côté front : ajoute famille_nom
      const rows = fiches.map((f) => ({
        ...f,
        famille_nom: f.famille_id
          ? famillesById[f.famille_id]?.nom ?? '—'
          : '—',
      }));

      return { rows, total: count ?? 0 };
    },
    keepPreviousData: true,
    staleTime: 10_000,
  });
}

