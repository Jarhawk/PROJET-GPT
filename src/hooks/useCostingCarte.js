// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { pdf } from '@react-pdf/renderer'
import CostingCartePDF from '@/components/costing/CostingCartePDF'

export function useCostingCarte() {
  const { mama_id } = useAuth()
  const [rows, setRows] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCosting = useCallback(
    async ({ type, famille, actif } = {}) => {
      if (!mama_id) return []
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('v_costing_carte')
          .select('*')
          .eq('mama_id', mama_id)
        if (type) query = query.eq('type', type)
        if (famille) query = query.eq('famille', famille)
        if (actif !== undefined) query = query.eq('actif', actif)
        const { data, error } = await query
        if (error) throw error
        setRows(data || [])
        return data || []
      } catch (e) {
        setError(e)
        setRows([])
        return []
      } finally {
        setLoading(false)
      }
    },
    [mama_id]
  )

  const fetchSettings = useCallback(async () => {
    if (!mama_id) return null
    const { data, error } = await supabase
      .from('settings')
      .select('objectif_marge_pct, objectif_food_cost_pct')
      .eq('mama_id', mama_id)
      .single()
    if (error) {
      setError(error)
      setSettings(null)
      return null
    }
    setSettings(data)
    return data
  }, [mama_id])

  const exportExcel = useCallback((data) => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Costing')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    saveAs(blob, 'costing_carte.xlsx')
  }, [])

  const exportPdf = useCallback(
    async (data, opts = {}) => {
      const doc = <CostingCartePDF fiches={data} settings={settings} mamaName={opts.mamaName} />
      const blob = await pdf(doc).toBlob()
      saveAs(blob, 'costing_carte.pdf')
    },
    [settings]
  )

  return {
    rows,
    settings,
    loading,
    error,
    fetchCosting,
    fetchSettings,
    exportExcel,
    exportPdf,
  }
}
