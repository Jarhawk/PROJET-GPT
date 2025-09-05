import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'

/**
 * Hook zones de stock (plat, sans embed).
 * - Retourne toujours un tableau [] en cas d'erreur/chargement.
 * - Supporte un flag onlyActive pour filtrer actif=true (par défaut).
 */
export function useZonesStock(mamaId, { onlyActive = true } = {}) {
  return useQuery({
    queryKey: ['inventaire_zones', mamaId, onlyActive],
    queryFn: async () => {
      if (!mamaId) return []
      let q = supabase
        .from('inventaire_zones')
        .select('id, nom, mama_id, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true })

      if (onlyActive) q = q.eq('actif', true)

      const { data, error } = await q
      if (error) {
        console.warn('[useZonesStock] fallback []', error)
        return []
      }
      return data ?? []
    },
    initialData: [],
  })
}

// (optionnel) utilitaire de fetch direct si besoin ailleurs
export async function fetchZonesStock(mamaId, { onlyActive = true } = {}) {
  if (!mamaId) return []
  let q = supabase
    .from('inventaire_zones')
    .select('id, nom, mama_id, actif')
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
  if (onlyActive) q = q.eq('actif', true)
  const { data, error } = await q
  if (error) {
    console.warn('[fetchZonesStock] fallback []', error)
    return []
  }
  return data ?? []
}
