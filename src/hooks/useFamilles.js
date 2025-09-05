import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supa/client'
import { useAuth } from '@/hooks/useAuth'

/**
 * Fetch familles for a given mama.
 * @param {string} mamaId
 * @returns {Promise<Array<{id:string, nom:string, actif:boolean, mama_id:string, famille_parent_id:string|null, populaire:boolean|null}>>}
 */
export async function fetchFamilles(mamaId) {
  const { data, error } = await supabase
    .from('familles')
    .select('id, nom, actif, mama_id, famille_parent_id, populaire')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
  if (error) {
    console.warn('[fetchFamilles] fallback []', error)
    return []
  }
  return data ?? []
}

export function useFamilles() {
  const { mama_id } = useAuth()
  const [familles, setFamilles] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const res = await fetchFamilles(mama_id)
    const list = Array.isArray(res) ? res : res?.data ?? []
    setFamilles(list)
    setLoading(false)
    return list
  }, [mama_id])

  const addFamille = useCallback(
    async (values) => {
      const { data, error } = await supabase
        .from('familles')
        .insert([{ ...values, mama_id }])
        .select()
        .single()
      if (!error) setFamilles((prev) => [...prev, data])
      return { data, error }
    },
    [mama_id]
  )

  const updateFamille = useCallback(
    async (id, values) => {
      const { data, error } = await supabase
        .from('familles')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .select()
        .single()
      if (!error)
        setFamilles((prev) => prev.map((f) => (f.id === id ? data : f)))
      return { data, error }
    },
    [mama_id]
  )

  const deleteFamille = useCallback(
    async (id) => {
      const { error } = await supabase
        .from('familles')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id)
      if (!error)
        setFamilles((prev) => prev.filter((f) => f.id !== id))
      return { error }
    },
    [mama_id]
  )

  return {
    familles,
    fetchFamilles: fetch,
    addFamille,
    updateFamille,
    deleteFamille,
    loading,
  }
}

export default useFamilles
