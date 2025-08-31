import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function useFacturesList(params = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const {
    search = '',
    fournisseur = '',
    statut = '',
    actif = true,
    page = 1,
    pageSize = 20,
  } = params;

  return useQuery({
    queryKey: ['factures-list', mamaId, search, fournisseur, statut, actif, page, pageSize],
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
          'id, numero, date_facture, fournisseur_id, total_ttc, statut, actif, fournisseur:fournisseur_id(id, nom, mama_id)',
          { count: 'exact' }
        )
        .eq('mama_id', mamaId)
        .eq('fournisseur.mama_id', mamaId)
        .order('date_facture', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(`numero.ilike.%${search}%,fournisseur.nom.ilike.%${search}%`);
      }
      if (fournisseur) query = query.eq('fournisseur_id', fournisseur);
      if (statut) query = query.eq('statut', statut);
      if (actif !== null) query = query.eq('actif', actif);

      const { data, error, count } = await query;
      if (error) throw error;
      return { factures: Array.isArray(data) ? data : [], total: count || 0 };
    },
  });
}

export default useFacturesList;
