// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'

export function useCostingCarte() {
  const { mama_id } = useAuth()
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFichesPourLaCarte = useCallback(async () => {
    if (!mama_id) return []
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('fiches_techniques')
        .select('id, nom, famille, sous_famille, type, portions, cout_total, prix_vente')
        .eq('mama_id', mama_id)
        .eq('actif', true)
        .not('prix_vente', 'is', null)
        .gt('prix_vente', 0)
        .gt('portions', 0)
        .order('nom')
      if (error) throw error
      const rows = (data || []).map(f => {
        const cout = f.cout_total && f.portions ? f.cout_total / f.portions : 0
        const marge = f.prix_vente - cout
        const taux = f.prix_vente > 0 ? (cout / f.prix_vente) * 100 : null
        return { ...f, cout_unitaire: cout, marge_brute: marge, taux_food_cost: taux }
      })
      setFiches(rows)
      return rows
    } catch (e) {
      setError(e)
      setFiches([])
      return []
    } finally {
      setLoading(false)
    }
  }, [mama_id])

  return { fiches, loading, error, fetchFichesPourLaCarte }
}
