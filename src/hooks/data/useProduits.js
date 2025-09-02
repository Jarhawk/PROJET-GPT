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
        // Colonnes conformes à db/Etat back end.txt (lignes 601 à 626)
        let q = supabase
          .from('produits')
          .select(
            'id, nom, unite_id, tva, zone_stock_id, famille_id, sous_famille_id, actif, mama_id',
            { count: 'exact' }
          )
          .eq('mama_id', mamaId);

      if (search) q = q.ilike('nom', `%${search}%`);
      if (familleId) q = q.eq('famille_id', familleId);
      if (sousFamilleId) q = q.eq('sous_famille_id', sousFamilleId);
      if (statut === 'actif') q = q.eq('actif', true);
      if (statut === 'inactif') q = q.eq('actif', false);

      q = q
        .order('nom', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];

      const [
        { data: sous, error: errSous },
        { data: fams, error: errFams },
        { data: unites, error: errUnites },
      ] = await Promise.all([
        supabase
          .from('sous_familles')
          .select('id, nom, famille_id, mama_id')
          .eq('mama_id', mamaId),
        supabase
          .from('familles')
          .select('id, nom, mama_id')
          .eq('mama_id', mamaId),
        supabase
          .from('unites')
          .select('id, nom, mama_id')
          .eq('mama_id', mamaId),
      ]);

      const sousById = {};
      if (!errSous) {
        for (const sf of Array.isArray(sous) ? sous : []) {
          sousById[sf.id] = sf;
        }
      }

      const famillesById = {};
      if (!errFams) {
        for (const f of Array.isArray(fams) ? fams : []) {
          famillesById[f.id] = f;
        }
      }

      const unitesById = {};
      if (!errUnites) {
        for (const u of Array.isArray(unites) ? unites : []) {
          unitesById[u.id] = u;
        }
      }

      const enriched = rows.map((p) => {
        const sf = p.sous_famille_id ? sousById[p.sous_famille_id] : null;
        const famille =
          p.famille_id
            ? famillesById[p.famille_id]
            : sf?.famille_id
              ? famillesById[sf.famille_id]
              : null;
        return {
          ...p,
          sous_famille: sf || null,
          famille: famille || null,
          unite: p.unite_id ? unitesById[p.unite_id] || null : null,
        };
      });

      return { data: enriched, count: count ?? 0 };
    },
  });
};
export default useProduits;


