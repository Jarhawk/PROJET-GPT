import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export function useFamilles(mamaId) {
  return useQuery({
    queryKey: ['familles', mamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('familles')
        .select('id, nom, mama_id')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
        .limit(50)

      if (error) {
        console.warn('[useFamilles] fallback to []', error)
        return []
      }
      return data ?? []
    }
  })
}

export default useFamilles
