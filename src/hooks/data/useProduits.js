// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import useMamaSettings from '@/hooks/useMamaSettings';

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
  familleId = null,
  sousFamilleId = null,
}) => {
  const { mamaId } = useMamaSettings();
  return useQuery({
    queryKey: ['produits', mamaId, search, page, pageSize, statut, familleId, sousFamilleId],
    queryFn: async () => {
      let q = supabase
        .from('produits')
        .select(
          `
          id, nom, unite_id, prix_vente, pmp, actif,
          sous_famille_id,
          famille:familles!fk_produits_famille(id, nom),
          sous_famille:sous_familles!fk_produits_sous_famille(id, nom),
          zone_id:zone_stock_id
          `,
          { count: 'exact' }
        )
        .eq('mama_id', mamaId);

      if (search) q = q.ilike('nom', `%${search}%`);
      if (familleId) q = q.eq('famille_id', familleId);
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


