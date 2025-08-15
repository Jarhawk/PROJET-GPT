// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react'
import supabase from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function useCostingCarte() {
  const { mama_id } = useAuth()
  const [data, setData] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCosting = useCallback(
    async (filters = {}) => {
      if (!mama_id) return []
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('v_costing_carte')
          .select('*')
          .eq('mama_id', mama_id)

        if (filters.type) query = query.eq('type', filters.type)
        if (filters.famille) query = query.eq('famille', filters.famille)
        if (filters.actif !== undefined) query = query.eq('actif', filters.actif)

        const { data: rows, error } = await query.order('nom')
        if (error) throw error
        setData(rows || [])
        return rows || []
      } catch (e) {
        setError(e)
        setData([])
        return []
      } finally {
        setLoading(false)
      }
    },
    [mama_id]
  )

  const fetchSettings = useCallback(
    async () => {
      if (!mama_id) return null
      const { data: row, error } = await supabase
        .from('settings')
        .select('objectif_marge_pct, objectif_food_cost_pct')
        .eq('mama_id', mama_id)
        .single()
      if (error) return null
      setSettings(row)
      return row
    },
    [mama_id]
  )

  const exportExcel = useCallback((rows) => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Costing')
    XLSX.writeFile(wb, 'costing_carte.xlsx')
  }, [])

  const exportPdf = useCallback((rows) => {
    const doc = new jsPDF()
    const headers = [
      ['Nom fiche', 'Type', 'Coût/portion', 'Prix vente', 'Marge €', 'Marge %', 'Food cost %'],
    ]
    const body = rows.map((r) => [
      r.nom,
      r.type,
      r.cout_par_portion ?? '',
      r.prix_vente ?? '',
      r.marge_euro ?? '',
      r.marge_pct ?? '',
      r.food_cost_pct ?? '',
    ])
    doc.autoTable({ head: headers, body })
    doc.save('costing_carte.pdf')
  }, [])

  return {
    data,
    settings,
    loading,
    error,
    fetchCosting,
    fetchSettings,
    exportExcel,
    exportPdf,
  }
}

