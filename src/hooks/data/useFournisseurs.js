// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// fix: avoid ilike.%% on empty search.
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';
import { normalizeSearchTerm } from '@/lib/supa/textSearch';


export function useFournisseurs(params = {}) {
  const { mama_id } = useAuth();
  const {
    search = '',
    actif = true,
    page = 1,
    limit = 50
  } = params;

  const term = normalizeSearchTerm(search);
  const filtre = { search: term, actif, page, limit };

  return useQuery({
    queryKey: ['fournisseurs', mama_id, filtre],
    enabled: !!mama_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      let q = supabase
        .from('fournisseurs')
        .select('id, nom, actif, contact:fournisseur_contacts(nom,email,tel)', { count: 'exact' })
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true })
        .range((page - 1) * limit, page * limit - 1)
        .abortSignal(signal)
        .limit(1, { foreignTable: 'fournisseur_contacts' });

      if (term) q = q.ilike('nom', `%${term}%`);
      if (actif !== null && actif !== undefined) q = q.eq('actif', actif);

      const { data, error, count } = await run(q);
      if (error) {
        logError('[useFournisseurs] list', error);
        return { data: [], count: 0, embedError: error };
      }

      const mapped = (data || []).map((f) => ({
        ...f,
        contact: Array.isArray(f.contact) ? f.contact[0] || null : f.contact ?? null,
      }));

      return { data: mapped, count: count || 0, embedError: null };
    },
  });
}

export default useFournisseurs;
