// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMamaSettings } from '@/hooks/useMamaSettings';

export const useProduits = ({
  search = '',
  statut = 'tous',
  familleId = null,
  sousFamilleId = null,
  page = 1,
  pageSize = 25,
}) => {
  const { mamaId } = useMamaSettings();

  return useQuery({
    queryKey: ['produits', mamaId, search, statut, familleId, sousFamilleId, page, pageSize],
    enabled: !!mamaId,
    queryFn: async () => {
      let query = supabase
        .from('produits')
        .select(
          `
          id, nom, unite, pmp, zone_stockage, actif, mama_id,
          famille:familles ( id, nom ),
          sous_famille:sous_familles ( id, nom )
        `,
          { count: 'exact' }
        )
        .eq('mama_id', mamaId);

      if (search) {
        query = query.ilike('nom', `%${search}%`);
      }
      if (statut === 'actif') query = query.eq('actif', true);
      if (statut === 'inactif') query = query.eq('actif', false);
      if (familleId) query = query.eq('famille_id', familleId);
      if (sousFamilleId) query = query.eq('sous_famille_id', sousFamilleId);

      query = query
        .order('nom', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
    keepPreviousData: true,
    staleTime: 10_000,
  });
};


