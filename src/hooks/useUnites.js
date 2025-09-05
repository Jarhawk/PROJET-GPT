import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export async function fetchUnites(mamaId) {
  const { data, error } = await supabase
    .from('unites')
    .select('id, nom, mama_id, actif')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
  if (error) {
    console.warn('[fetchUnites] fallback []', error)
    return []
  }
  return data ?? []
}

export function useUnites(mamaId) {
  return useQuery({
    queryKey: ['unites', mamaId],
    queryFn: () => fetchUnites(mamaId),
    initialData: [],
  })
}

export const fetchUnitesForValidation = fetchUnites

export default useUnites
