import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useSupabaseClient from '@/hooks/useSupabaseClient'
import useDebounce from './useDebounce'
import { useMultiMama } from '@/context/MultiMamaContext'

export default function useProductSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const supabase = useSupabaseClient()
  const { mamaActif: currentMamaId } = useMultiMama()

  const debounced = useDebounce(query.trim(), 300)

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('produits')
      .select('id, nom, stock_reel, pmp, v_produits_dernier_prix (prix)')
      .ilike('nom', `%${debounced}%`)
      .eq('mama_id', currentMamaId)
      .limit(20)
      .order('nom', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['product-search', currentMamaId, debounced],
    queryFn: fetchProducts,
    enabled: !!currentMamaId && debounced.length > 0,
  })

  return { query, setQuery, results, isLoading, error }
}

