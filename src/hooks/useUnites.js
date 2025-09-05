import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export function useUnites(mamaId) {
  return useQuery({
    queryKey: ['unites', mamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unites')
        .select('id, nom, mama_id, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
      if (error) { console.warn('[useUnites]', error); return [] }
      return data ?? []
    },
  })
}

export async function fetchUnitesForValidation(mamaId) {
  const { data, error } = await supabase
    .from('unites')
    .select('id, nom, mama_id')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
  if (error) { console.warn('[fetchUnitesForValidation]', error); return [] }
  return data ?? []
}
