import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

export function useFamilles(mamaId) {
  return useQuery({
    queryKey: ['familles', mamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('familles')
        .select('id, nom, mama_id, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })
        .limit(50)

      if (error) {
        console.warn('[useFamilles] fallback []', error)
        return []
      }
      return data ?? []
    },
  })
}

export async function fetchFamillesForValidation(mamaId) {
  const { data, error } = await supabase
    .from('familles')
    .select('id, nom, mama_id')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })

  if (error) {
    console.warn('[fetchFamillesForValidation] fallback []', error)
    return []
  }

  const slugify = (s='') =>
    s.toLowerCase()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9]+/g, '_')
     .replace(/^_+|_+$/g, '')

  return (data ?? []).map(f => ({
    id: f.id,
    nom: f.nom,
    mama_id: f.mama_id,
    code: slugify(f.nom),
  }))
}
