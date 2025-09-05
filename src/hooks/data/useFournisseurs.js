// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// fix: avoid ilike.%% on empty search.
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { run } from '@/lib/supa/fetcher';
import { logError } from '@/lib/supa/logError';
import { normalizeSearchTerm } from '@/lib/supa/textSearch';
import { applyRange } from '@/lib/supa/range';


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
      // 1er fetch simple (pas d'embed)
      let q1 = supabase
        .from('fournisseurs')
        .select('id, nom, actif')
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true });
      q1 = applyRange(q1, (page - 1) * limit, limit).abortSignal(signal);

      if (term) q1 = q1.ilike('nom', `%${term}%`);
      if (actif !== null && actif !== undefined) q1 = q1.eq('actif', actif);

      const { data: fournisseurs, error: e1 } = await run(q1);
      if (e1) {
        logError('[useFournisseurs] q1', e1);
        return [];
      }
      if (!fournisseurs?.length) return [];

      // 2) Récupérer contacts par lot
      const ids = fournisseurs.map((f) => f.id);
      const { data: contacts, error: e2 } = await run(
        supabase
          .from('fournisseur_contacts')
          .select('id, nom, email, tel, fournisseur_id')
          .eq('mama_id', mama_id)
          .in('fournisseur_id', ids)
          .abortSignal(signal)
      );
      if (e2) {
        logError('[useFournisseurs] contacts', e2);
      }

      const byF = new Map();
      (contacts ?? []).forEach((c) => {
        byF.set(c.fournisseur_id, { nom: c.nom, email: c.email, tel: c.tel });
      });

      return fournisseurs.map((f) => ({
        ...f,
        contact: byF.get(f.id) ?? null,
      }));
    },
  });
}

export default useFournisseurs;
