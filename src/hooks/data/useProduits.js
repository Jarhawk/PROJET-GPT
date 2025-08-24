// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useMamaSettings } from '@/hooks/useMamaSettings';

/**
 * Liste paginée des produits avec filtres.
 * - statut: 'tous' | 'actif' | 'inactif'
 * - sousFamilleId: UUID ou null
 */
export const useProduits = ({
  search = '',
  page = 1,
  pageSize = 25,
  statut = 'tous',
  sousFamilleId = null,
}) => {
  const { mamaId } = useMamaSettings();
  return useQuery({
    queryKey: ['produits', mamaId, search, page, pageSize, statut, sousFamilleId],
    queryFn: async () => {
      let q = supabase
        .from('produits')
        .select(
          'id, nom, unite, pmp, zone_stockage, actif, sous_famille_id, sous_famille:sous_familles(id, nom)',
          { count: 'exact' }
        )
        .eq('mama_id', mamaId);

      if (search) q = q.ilike('nom', `%${search}%`);
      if (sousFamilleId) q = q.eq('sous_famille_id', sousFamilleId);
      if (statut === 'actif') q = q.eq('actif', true);
      if (statut === 'inactif') q = q.eq('actif', false);

      q = q.order('nom', { ascending: true })
           .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
};
export default useProduits;


