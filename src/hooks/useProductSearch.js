import { useQuery } from '@tanstack/react-query'
import useSupabaseClient from '@/hooks/useSupabaseClient'

const ESCAPE_RE = /[%_]/g
const escapeLike = (s) => s.replace(ESCAPE_RE, '\\$&')

/**
 * Recherche de produits PAR NOM UNIQUEMENT.
 * - Ne sélectionne QUE les colonnes sûres ("id","nom") pour éviter les 42703.
 * - Filtre par mama_id.
 * - Debounce géré par le composant (on lui passe term déjà debounced si besoin).
 */
export default function useProductSearch({ mamaId, term = '', open = true, limit = 50 }) {
  const supabase = useSupabaseClient()
  const q = (term ?? '').trim()

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
        .select('id,nom')            // ⬅️ ne plus demander unite_achat / tva / barcode / etc.
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
        .limit(limit)

      if (q) {
        req = req.ilike('nom', `%${escapeLike(q)}%`)
      }

      const { data, error } = await req
      if (error) throw error
      return data ?? []
    }
  })
}
