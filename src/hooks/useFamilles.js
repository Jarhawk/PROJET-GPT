import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export async function fetchFamilles(mamaId) {
  const { data, error } = await supabase
    .from('familles')
    .select('id, nom, mama_id, actif')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
  if (error) {
    console.warn('[fetchFamilles] fallback []', error)
    return []
  }
  return data ?? []
}

export function useFamilles(mamaId) {
  return useQuery({
    queryKey: ['familles', mamaId],
    queryFn: () => fetchFamilles(mamaId),
    initialData: [],
  })
}

export const fetchFamillesForValidation = fetchFamilles

export default useFamilles
