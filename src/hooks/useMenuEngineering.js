// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'

export function useMenuEngineering() {
  const { mama_id } = useAuth()
  const [data, setData] = useState([])

  const fetchData = useCallback(
    async (periode) => {
      if (!mama_id) return []
      const { data: fiches, error } = await supabase
        .from('v_menu_engineering')
        .select('*')
        .eq('mama_id', mama_id)
        .eq('periode', periode)
        .order('nom')
      if (error) throw error

      const rows = (fiches || []).map(f => {
        const cout = f.cout_portion ?? 0
        const p = f.prix_vente ?? 0
        const qty = f.ventes ?? 0
        const pop = f.popularite ?? 0
        const foodCost = p > 0 ? (cout / p) * 100 : null
        const marge = p > 0 ? ((p - cout) / p) * 100 : 0
        return {
          ...f,
          prix_vente: p,
          cout_portion: cout,
          ventes: qty,
          popularite: pop,
          foodCost,
          marge,
          x: pop * 100,
          y: marge,
        }
      })

      const medPop = median(rows.map(r => r.ventes))
      const medMarge = median(rows.map(r => r.marge))
      rows.forEach(r => {
        if (r.ventes >= medPop && r.marge >= medMarge) r.classement = 'Star'
        else if (r.ventes >= medPop && r.marge < medMarge) r.classement = 'Plowhorse'
        else if (r.ventes < medPop && r.marge >= medMarge) r.classement = 'Puzzle'
        else r.classement = 'Dog'
        r.score_calc = Math.round(r.marge + r.popularite * 100)
      })
      setData(rows)
      return rows
    },
    [mama_id]
  )

  const median = arr => {
    const s = [...arr].sort((a, b) => a - b)
    return s.length ? s[Math.floor(s.length / 2)] : 0
  }

  const saveVente = useCallback(
    async (fiche_id, periode, ventes) => {
      if (!mama_id) return
      const { data: existing } = await supabase
        .from('ventes_fiches_carte')
        .select('id')
        .eq('fiche_id', fiche_id)
        .eq('periode', periode)
        .eq('mama_id', mama_id)
        .maybeSingle()
      let error
      if (existing) {
        ;({ error } = await supabase
          .from('ventes_fiches_carte')
          .update({ ventes })
          .eq('id', existing.id)
          .eq('mama_id', mama_id))
      } else {
        ;({ error } = await supabase
          .from('ventes_fiches_carte')
          .insert({ fiche_id, periode, ventes, mama_id }))
      }
      if (error) throw error
    },
    [mama_id]
  )

  return { data, fetchData, saveVente }
}
