import { useCallback, useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'
import { useAuth } from '@/hooks/useAuth'
import { fetchUnites } from './useUnites'
import { fetchFamilles } from './useFamilles'

export async function fetchProducts({ mamaId, limit = 100, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('produits')
    .select(
      `id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp,
      stock_reel, stock_min, stock_theorique, created_at, updated_at`,
      { count: 'exact' }
    )
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.warn('[fetchProducts] fallback []', error)
    return { data: [], count: 0 }
  }

  const [unites, familles] = await Promise.all([
    fetchUnites(mamaId),
    fetchFamilles(mamaId),
  ])
  const uniteMap = Object.fromEntries(unites.map(u => [u.id, u.nom]))
  const familleMap = Object.fromEntries(familles.map(f => [f.id, f.nom]))

  const enriched = (data ?? []).map(p => ({
    ...p,
    unite_nom: uniteMap[p.unite_id] ?? null,
    famille_nom: familleMap[p.famille_id] ?? null,
  }))

  return { data: enriched, count: count ?? 0 }
}

export function useProducts(opts = {}) {
  const { mama_id } = useAuth()
  const [loading, setLoading] = useState(false)

  const { mamaId = mama_id, limit = 100, offset = 0 } = opts
  const queryKey = useMemo(() => ['produits', mamaId, limit, offset], [mamaId, limit, offset])
  const enabled = !!mamaId

  const fetcher = useCallback(
    (p = {}) => fetchProducts({ mamaId, limit, offset, ...p }),
    [mamaId, limit, offset]
  )

  useEffect(() => {
    const url = `/rest/v1/produits?select=id,nom,mama_id,actif,famille_id,unite_id,code,image,pmp,stock_reel,stock_min,stock_theorique,created_at,updated_at&mama_id=eq.${mamaId}&order=nom.asc&offset=${offset}&limit=${limit}`
    console.log('[useProducts]', { queryKey, enabled, mamaId, url })
  }, [queryKey, enabled, mamaId, limit, offset])

  const query = useQuery({
    queryKey,
    queryFn: () => fetcher(),
    enabled,
    initialData: { data: [], count: 0 },
  })

  const addProduct = useCallback(async (product, { refresh = true } = {}) => {
    if (!mamaId) return { error: 'no_mama' }
    setLoading(true)
    const { error } = await supabase
      .from('produits')
      .insert([{ ...product, mama_id: mamaId }])
    setLoading(false)
    if (!error && refresh) query.refetch?.()
    return { error }
  }, [mamaId, query])

  const updateProduct = useCallback(async (id, fields, { refresh = true } = {}) => {
    if (!mamaId) return { error: 'no_mama' }
    setLoading(true)
    const { error } = await supabase
      .from('produits')
      .update(fields)
      .eq('id', id)
      .eq('mama_id', mamaId)
    setLoading(false)
    if (!error && refresh) query.refetch?.()
    return { error }
  }, [mamaId, query])

  const toggleProductActive = useCallback(
    (id, actif, opts = {}) => updateProduct(id, { actif }, opts),
    [updateProduct]
  )

  const getProduct = useCallback(async (id) => {
    if (!mamaId) return null
    const { data, error } = await supabase
      .from('produits')
      .select(`id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp,
        stock_reel, stock_min, stock_theorique, created_at, updated_at`)
      .eq('id', id)
      .eq('mama_id', mamaId)
      .single()
    if (error) {
      console.warn('[getProduct]', error)
      return null
    }
    const [unites, familles] = await Promise.all([
      fetchUnites(mamaId),
      fetchFamilles(mamaId),
    ])
    const uniteMap = Object.fromEntries(unites.map(u => [u.id, u.nom]))
    const familleMap = Object.fromEntries(familles.map(f => [f.id, f.nom]))
    return data ? {
      ...data,
      unite_nom: uniteMap[data.unite_id] ?? null,
      famille_nom: familleMap[data.famille_id] ?? null,
    } : null
  }, [mamaId])

  const fetchProductPrices = useCallback(async (productId) => {
    if (!mamaId) return []
    const { data, error } = await supabase
      .from('v_produits_dernier_prix')
      .select('produit_id, dernier_prix, fournisseur_id, created_at')
      .eq('produit_id', productId)
      .eq('mama_id', mamaId)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[fetchProductPrices]', error)
      return []
    }
    return data ?? []
  }, [mamaId])

  return {
    ...query,
    loading: query.isFetching || loading,
    addProduct,
    updateProduct,
    toggleProductActive,
    getProduct,
    fetchProductPrices,
    fetchProducts: fetcher,
  }
}

export default useProducts
