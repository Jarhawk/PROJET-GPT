import supabase from '@/lib/supabase';
import { applyRange } from '@/lib/supa/applyRange';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';


export function useFacturesList(params = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const {
    search = '',
    fournisseur = '',
    statut = '',
    page = 1,
    pageSize = 20
  } = params;

  return useQuery({
    queryKey: ['factures-list', mamaId, search, fournisseur, statut, page, pageSize],
    enabled: !!mamaId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    keepPreviousData: true,
    queryFn: async () => {
      let query = supabase
        .from('factures')
        .select(
          'id, numero, date_facture, montant, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!factures_fournisseur_id_fkey(id, nom)',
          { count: 'exact' }
        )
        .eq('mama_id', mamaId)
        .order('date_facture', { ascending: false });

      if (search) {
        query = query.or(`numero.ilike.%${search}%,fournisseurs.nom.ilike.%${search}%`);
      }
      if (fournisseur) query = query.eq('fournisseur_id', fournisseur);
      if (statut) query = query.eq('statut', statut);

      const { data, error, count } = await applyRange(
        query,
        (page - 1) * pageSize,
        pageSize
      );
      if (error) throw error;
      return { factures: data || [], total: count || 0 };
    }
  });
}

export default useFacturesList;