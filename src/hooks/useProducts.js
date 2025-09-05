import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export function useProducts({ mamaId, limit = 100, offset = 0 }) {
  return useQuery({
    queryKey: ['produits', mamaId, limit, offset],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('produits')
        .select(
          `id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp,
          stock_reel, stock_min, stock_theorique, created_at, updated_at`,
          { count: 'exact' }
        )
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('[useProducts] query error', error)
        return { data: [], count: 0 }
      }
      return { data: data ?? [], count: count ?? 0 }
    },
  })
}
