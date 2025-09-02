// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useMamaSettings } from '@/hooks/useMamaSettings';

/**
 * Liste paginée des produits avec filtres.
 * - statut: 'tous' | 'actif' | 'inactif'
 * - sousFamilleId: UUID ou null
 * Inclut familles et sous-familles via FKs nommées.
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
      enabled: !!mamaId,
      queryFn: async () => {
        // Colonnes autorisées : id, nom, unite_id, tva, zone_stock_id, famille_id, sous_famille_id, actif, mama_id
        // Join nom de l'unité et des (sous-)familles via leurs FKs
        let q = supabase
          .from('produits')
          .select(
            `
            id, nom, unite_id, tva, zone_id:zone_stock_id, famille_id, sous_famille_id, actif, mama_id,
            unite:unites(id, nom),
            sous_famille:sous_familles!fk_produits_sous_famille(
              id, nom, famille:familles(id, nom)
            )
            `,
            { count: 'exact' }
          )
          .eq('mama_id', mamaId)
          .eq('unite.mama_id', mamaId)
          .eq('sous_famille.mama_id', mamaId)
          .eq('sous_famille.famille.mama_id', mamaId);

      if (search) q = q.ilike('nom', `%${search}%`);
      if (familleId) q = q.eq('famille_id', familleId);
      if (sousFamilleId) q = q.eq('sous_famille_id', sousFamilleId);
      if (statut === 'actif') q = q.eq('actif', true);
      if (statut === 'inactif') q = q.eq('actif', false);

      q = q.order('nom', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: Array.isArray(data) ? data : [], count: count ?? 0 };
    },
  });
};
export default useProduits;


