import { useCallback, useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supa/client'
import { useAuth } from '@/hooks/useAuth'

export async function fetchProducts({ mamaId, limit = 100, offset = 0, search = '', filters = {} } = {}) {
  const { data, error, count } = await supabase
    .from('produits')
    .select(
      `id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp,
      stock_reel, stock_min, stock_theorique, created_at, updated_at,
      unite:unites!fk_produits_unite(nom),
      famille:familles!fk_produits_famille(nom)`,
      { count: 'exact' }
    )
    .eq('mama_id', mamaId)
    .order('nom', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.warn('[fetchProducts] fallback []', error)
    return { data: [], count: 0 }
  }

  const enriched = (data ?? []).map(p => ({
    ...p,
    unite_nom: p.unite?.nom ?? null,
    famille_nom: p.famille?.nom ?? null,
  }))

  return { data: enriched, count: count ?? 0 }
}

export function useProducts({
  mamaId,
  limit = 50,
  offset = 0,
  filters = {},
  search = '',
} = {}) {
  const { mama_id } = useAuth()
  const [loading, setLoading] = useState(false)

  const resolvedMama = mamaId ?? mama_id
  const queryKey = useMemo(
    () => ['produits', resolvedMama, limit, offset, filters, search],
    [resolvedMama, limit, offset, filters, search]
  )
  const enabled = !!resolvedMama

  const fetcher = useCallback(
    (p = {}) =>
      fetchProducts({ mamaId: resolvedMama, limit, offset, filters, search, ...p }),
    [resolvedMama, limit, offset, filters, search]
  )

  useEffect(() => {
    const url = `/rest/v1/produits?select=id,nom,mama_id,actif,famille_id,unite_id,code,image,pmp,stock_reel,stock_min,stock_theorique,created_at,updated_at,unite:unites!fk_produits_unite(nom),famille:familles!fk_produits_famille(nom)&mama_id=eq.${resolvedMama}&order=nom.asc&offset=${offset}&limit=${limit}`
    console.log('[useProducts]', { queryKey, enabled, mamaId: resolvedMama, url })
  }, [queryKey, enabled, resolvedMama, limit, offset])

  const query = useQuery({
    queryKey,
    queryFn: () => fetcher(),
    enabled,
    initialData: { data: [], count: 0 },
  })

  const addProduct = useCallback(async (product, { refresh = true } = {}) => {
    if (!resolvedMama) return { error: 'no_mama' }
    setLoading(true)
    const { error } = await supabase
      .from('produits')
      .insert([{ ...product, mama_id: resolvedMama }])
    setLoading(false)
    if (!error && refresh) query.refetch?.()
    return { error }
  }, [resolvedMama, query])

  const updateProduct = useCallback(async (id, fields, { refresh = true } = {}) => {
    if (!resolvedMama) return { error: 'no_mama' }
    setLoading(true)
    const { error } = await supabase
      .from('produits')
      .update(fields)
      .eq('id', id)
      .eq('mama_id', resolvedMama)
    setLoading(false)
    if (!error && refresh) query.refetch?.()
    return { error }
  }, [resolvedMama, query])

  const toggleProductActive = useCallback(
    (id, actif, opts = {}) => updateProduct(id, { actif }, opts),
    [updateProduct]
  )

  const getProduct = useCallback(async (id) => {
    if (!resolvedMama) return null
    const { data, error } = await supabase
      .from('produits')
      .select(`id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp,
        stock_reel, stock_min, stock_theorique, created_at, updated_at,
        unite:unites!fk_produits_unite(nom),
        famille:familles!fk_produits_famille(nom)`)
      .eq('id', id)
      .eq('mama_id', resolvedMama)
      .single()
    if (error) {
      console.warn('[getProduct]', error)
      return null
    }
    return data ? {
      ...data,
      unite_nom: data.unite?.nom ?? null,
      famille_nom: data.famille?.nom ?? null,
    } : null
  }, [resolvedMama])

  const fetchProductPrices = useCallback(async (productId) => {
    if (!resolvedMama) return []
    const { data, error } = await supabase
      .from('v_produits_dernier_prix')
      .select('produit_id, dernier_prix, fournisseur_id, created_at')
      .eq('produit_id', productId)
      .eq('mama_id', resolvedMama)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[fetchProductPrices]', error)
      return []
    }
    return data ?? []
  }, [resolvedMama])

  const data = query.data?.data ?? []
  const count = query.data?.count ?? 0

  return {
    data,
    count,
    products: data,
    isLoading: query.isLoading || loading,
    error: query.error,
    refetch: query.refetch,
    addProduct,
    updateProduct,
    toggleProductActive,
    getProduct,
    fetchProductPrices,
    fetchProducts: fetcher,
  }
}

export default useProducts
