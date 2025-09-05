import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export function useZonesStock(mamaId) {
  return useQuery({
    queryKey: ['zones_stock', mamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones_stock')
        .select('id, nom, mama_id, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
      if (error) { console.warn('[useZonesStock] query error', error); return [] }
      return data ?? []
    },
  })
}

export async function fetchZonesForValidation(mamaId) {
  const { data, error } = await supabase
    .from('zones_stock')
    .select('id, nom, mama_id')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
  if (error) return []
  return data ?? []
}
