import { useState, useEffect } from 'react'
import useSupabaseClient from '@/hooks/useSupabaseClient'
import useDebounce from './useDebounce'
import { useMultiMama } from '@/context/MultiMamaContext'

export default function useProductSearch(initialQuery = '') {
  const supabase = useSupabaseClient()
  const { mamaActif: currentMamaId } = useMultiMama()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const q = useDebounce(query.trim(), 150)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        let req = supabase
          .from('produits')
          .select('id, nom')
          .eq('mama_id', currentMamaId)
          .eq('actif', true)
          .order('nom', { ascending: true })
          .limit(50)

        if (q) req = req.ilike('nom', `%${q}%`)

        const { data, error } = await req
        if (error) throw error
        if (!cancel) setResults(data ?? [])
      } catch (e) {
        if (!cancel) setError(e)
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [supabase, currentMamaId, q])

  return { query, setQuery, results, isLoading, error }
}

