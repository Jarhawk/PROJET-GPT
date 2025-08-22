import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

export function useFactures(filters = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const { page = 1, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ['factures', mamaId, filters],
    enabled: !!mamaId,
    keepPreviousData: true,
    queryFn: async () => {
      let q = supabase
        .from('factures')
        .select(
          'id, numero, date_facture, fournisseur_id, montant_ttc:total_ttc, statut, actif, fournisseur:fournisseurs(nom)',
          { count: 'exact' }
        )
        .eq('mama_id', mamaId)
        .order('date_facture', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filters?.search) {
        q = q.ilike('numero', `%${filters.search}%`);
      }
      if (filters?.fournisseur?.id) {
        q = q.eq('fournisseur_id', filters.fournisseur.id);
      }
      if (filters?.statut) {
        q = q.eq('statut', filters.statut);
      }
      if (filters?.actif === 'true') q = q.eq('actif', true);
      if (filters?.actif === 'false') q = q.eq('actif', false);

      const { data, error, count } = await q;
      if (error) throw error;
      return { factures: data ?? [], total: count || 0 };
    },
  });
}

export default useFactures;
