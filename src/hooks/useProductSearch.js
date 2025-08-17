import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useSupabaseClient from '@/hooks/useSupabaseClient'
import { useMultiMama } from '@/context/MultiMamaContext'

const ESCAPE_RE = /[%_]/g
const escapeLike = (s) => s.replace(ESCAPE_RE, '\\$&')

export default function useProductSearch(initial = '') {
  const { mamaActif: mamaId } = useMultiMama()
  const [query, setQuery] = useState(initial)
  const q = (query ?? '').trim()
  const supabase = useSupabaseClient()

  const { data = [], isFetching, error } = useQuery({
    queryKey: ['produits:picker', mamaId, q],
    enabled: !!mamaId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    placeholderData: [],
    queryFn: async () => {
      let req = supabase
        .from('produits')
        .select('id, nom, code, unite')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
        .limit(100)
      if (q) {
        req = req.ilike('nom', `%${escapeLike(q)}%`)
      }
      const { data, error } = await req
      if (error) throw error
      return data ?? []
    }
  })

  return { query, setQuery, isLoading: isFetching, results: data, error }
}
