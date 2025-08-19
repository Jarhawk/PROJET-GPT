import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useSupabaseClient from '@/hooks/useSupabaseClient'
import useDebounce from '@/hooks/useDebounce'
import { useMultiMama } from '@/context/MultiMamaContext'
import { logSupaError } from '@/lib/supa/logError'

export default function useProductSearch(initialQuery = '') {
  const supabase = useSupabaseClient()
  const { mamaActif: currentMamaId } = useMultiMama()
  const [query, setQuery] = useState(initialQuery)
  const debounced = useDebounce(query.trim(), 300)

  const searchFn = async () => {
    const { data, error } = await supabase
      .from('produits')
      .select('id, nom, stock_reel, pmp, v_produits_dernier_prix(prix)')
      .eq('mama_id', currentMamaId)
      .ilike('nom', `%${debounced}%`)
      .limit(20)
      .order('nom', { ascending: true })
    if (error) {
      logSupaError('produits', error)
      throw error
    }
    return data ?? []
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-search', debounced, currentMamaId],
    queryFn: searchFn,
    enabled: !!debounced,
    staleTime: 5 * 60 * 1000,
  })

  return { query, setQuery, results: data ?? [], isLoading, error }
}
