// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useMamaSettings } from '@/hooks/useMamaSettings';

/**
 * Liste paginée des produits avec filtres.
 * - statut: 'tous' | 'actif' | 'inactif'
 * - sousFamilleId: UUID ou null
 * Note: on n'utilise PAS de join PostgREST pour la sous-famille.
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
          // on récupère les deux variantes pour la compat
          'id, nom, unite, pmp, zone_stockage, actif, sous_famille_id, sous_famille',
          { count: 'exact' }
        )
        .eq('mama_id', mamaId);

      if (search) q = q.ilike('nom', `%${search}%`);
      if (sousFamilleId) {
        // couvre soit "sous_famille_id", soit "sous_famille"
        q = q.or(`sous_famille_id.eq.${sousFamilleId},sous_famille.eq.${sousFamilleId}`);
      }
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


