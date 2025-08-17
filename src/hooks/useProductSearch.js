import { useQuery } from '@tanstack/react-query';
// ⚠️ ICI : on importe le default export et on le renomme pour l'utiliser
import useSupabaseClient from '@/hooks/useSupabaseClient';

// mini debounce pour limiter le spam réseau tout en restant instantané
const debounce = (fn, ms = 120) => {
  let t;
  return (...args) =>
    new Promise((resolve) => {
      clearTimeout(t);
      t = setTimeout(async () => resolve(await fn(...args)), ms);
    });
};

export function useProductSearch({ mamaId, term = '', open = true, limit = 50 }) {
  const supabase = useSupabaseClient();
  const q = (term ?? '').trim();

  return useQuery({
    queryKey: ['produits:search:nom', mamaId, q, open, limit],
    enabled: !!mamaId && !!open, // fetch seulement si la modale est ouverte
    queryFn: debounce(async () => {
      let query = supabase
        .from('produits')
        .select('id, nom, code, unite_achat, unite_vente, actif')
        .eq('mama_id', mamaId)
        .eq('actif', true);

      if (q.length > 0) {
        // recherche PAR NOM uniquement
        const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
        query = query.ilike('nom', pattern);
      }

      const { data, error } = await query.order('nom', { ascending: true }).limit(limit);
      if (error) throw error;
      return data ?? [];
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    placeholderData: [],
  });
}
