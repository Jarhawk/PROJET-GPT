import { useQuery } from '@tanstack/react-query';
import useSupabaseClient from '@/hooks/useSupabaseClient';

function escapeLike(value) {
  // pour ilike : échapper % et _
  return value.replace(/[%_]/g, '\\$&');
}

export default function useProductSearch({ mamaId, term = '', open = true, limit = 50 }) {
  const supabase = useSupabaseClient();
  const q = (term ?? '').trim();

  return useQuery({
    queryKey: ['produits:search:nom', mamaId, q, open, limit],
    enabled: !!mamaId && !!open,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    placeholderData: [],
    queryFn: async () => {
      let req = supabase
        .from('produits')
        // 🔥 NE PAS DEMANDER 'barcode' ou 'tva' si elles n’existent pas
        .select('id, nom, code, unite_achat, unite_vente, actif')
        .eq('mama_id', mamaId)
        .eq('actif', true)
        .order('nom', { ascending: true })
        .limit(limit);

      if (q) {
        const pattern = `%${escapeLike(q)}%`;
        req = req.ilike('nom', pattern);
      }

      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    },
  });
}
