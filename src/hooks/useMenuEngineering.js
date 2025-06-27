import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useMenuEngineering() {
  const { mama_id } = useAuth()
  const [data, setData] = useState([])

  const fetchData = useCallback(
    async (filters = {}) => {
      if (!mama_id) return []
      let q = supabase.from('fiches').select('*').eq('mama_id', mama_id).order('nom')
      if (filters.famille) q = q.eq('famille', filters.famille)
      if (filters.saison) q = q.eq('saison', filters.saison)
      if (filters.chef) q = q.eq('chef', filters.chef)
      const { data: fiches } = await q
      const { data: ventes } = await supabase.from('ventes_fiches').select('*').eq('mama_id', mama_id)
      const { data: prix } = await supabase.from('prix_vente').select('*').eq('mama_id', mama_id)

      const ventesMap = {}
      ;(ventes || []).forEach(v => {
        ventesMap[v.fiche_id] = (ventesMap[v.fiche_id] || 0) + (v.quantite || 0)
      })
      const prixMap = {}
      ;(prix || []).forEach(p => {
        prixMap[p.fiche_id] = p.prix
      })

      const totalVentes = Object.values(ventesMap).reduce((a, b) => a + b, 0)

      const rows = (fiches || []).map(f => {
        const cout = f.cout_total && f.portions ? f.cout_total / f.portions : 0
        const p = prixMap[f.id] ?? f.prix_vente ?? 0
        const qty = ventesMap[f.id] || 0
        const pop = totalVentes > 0 ? qty / totalVentes : 0
        const marge = p > 0 ? ((p - cout) / p) * 100 : 0
        return {
          ...f,
          prix_vente: p,
          cout_portion: cout,
          quantite: qty,
          popularite: pop,
          marge,
          x: pop * 100,
          y: marge,
        }
      })

      const medPop = median(rows.map(r => r.quantite))
      const medMarge = median(rows.map(r => r.marge))
      rows.forEach(r => {
        if (r.quantite >= medPop && r.marge >= medMarge) r.classement = 'Star'
        else if (r.quantite >= medPop && r.marge < medMarge) r.classement = 'Plowhorse'
        else if (r.quantite < medPop && r.marge >= medMarge) r.classement = 'Puzzle'
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
    async (fiche_id, quantite, prix_vente) => {
      if (!mama_id) return
      const { data: existing } = await supabase
        .from('ventes_fiches')
        .select('id')
        .eq('fiche_id', fiche_id)
        .eq('mama_id', mama_id)
        .maybeSingle()
      let error
      if (existing) {
        ;({ error } = await supabase
          .from('ventes_fiches')
          .update({ quantite, prix_vente })
          .eq('id', existing.id)
          .eq('mama_id', mama_id))
      } else {
        ;({ error } = await supabase
          .from('ventes_fiches')
          .insert({ fiche_id, quantite, prix_vente, mama_id }))
      }
      if (error) throw error
    },
    [mama_id]
  )

  return { data, fetchData, saveVente }
}
