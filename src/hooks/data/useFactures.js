import supabase from '@/lib/supabase';
import { applyRange } from '@/lib/supa/applyRange';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';


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
          'id, numero, date_facture, montant, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!factures_fournisseur_id_fkey(id, nom)',
          { count: 'exact' }
        )
        .eq('mama_id', mamaId)
        .order('date_facture', { ascending: false });

      if (filters?.search) {
        q = q.ilike('numero', `%${filters.search}%`);
      }
      if (filters?.fournisseur?.id) {
        q = q.eq('fournisseur_id', filters.fournisseur.id);
      }
      if (filters?.statut) {
        q = q.eq('statut', filters.statut);
      }

      const { data, error, count } = await applyRange(
        q,
        (page - 1) * pageSize,
        pageSize
      );
      if (error) throw error;
      return { factures: data ?? [], total: count || 0 };
    }
  });
}

export default useFactures;