// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCostingCarte } from '@/hooks/useCostingCarte'
import TableContainer from '@/components/ui/TableContainer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'

export default function CostingCarte() {
  const { role, loading: authLoading, access_rights } = useAuth()
  const {
    data: rawData,
    settings,
    loading,
    error,
    fetchCosting,
    fetchSettings,
    exportExcel,
    exportPdf,
  } = useCostingCarte()
  const data = useMemo(() => (Array.isArray(rawData) ? rawData : []), [rawData])

  const [typeFilter, setTypeFilter] = useState('')
  const [familleFilter, setFamilleFilter] = useState('')
  const [actifFilter, setActifFilter] = useState('')

  useEffect(() => {
    fetchCosting({})
    fetchSettings()
  }, [fetchCosting, fetchSettings])

  const familles = useMemo(() => {
    const set = new Set()
    for (const f of data) {
      if (f && f.famille) set.add(f.famille)
    }
    const arr = []
    for (const val of set) arr.push(val)
    arr.sort()
    return arr
  }, [data])

  const filtered = useMemo(() => {
    const out = []
    for (const f of data) {
      if (typeFilter && f.type !== typeFilter) continue
      if (familleFilter && f.famille !== familleFilter) continue
      if (actifFilter !== '' && f.actif !== (actifFilter === 'true')) continue
      out.push(f)
    }
    return out
  }, [data, typeFilter, familleFilter, actifFilter])

  const kpis = useMemo(() => {
    if (filtered.length === 0) return { marge: 0, food: 0, under: 0 }
    let sumMarge = 0
    let sumFood = 0
    let under = 0
    for (const f of filtered) {
      sumMarge += f.marge_pct || 0
      sumFood += f.food_cost_pct || 0
      if (
        (settings?.objectif_marge_pct &&
          f.marge_pct < settings.objectif_marge_pct) ||
        (settings?.objectif_food_cost_pct &&
          f.food_cost_pct > settings.objectif_food_cost_pct)
      ) {
        under++
      }
    }
    return { marge: sumMarge / filtered.length, food: sumFood / filtered.length, under }
  }, [filtered, settings])

  if (authLoading) return <LoadingSpinner message="Chargement..." />
  if (!['manager', 'admin', 'superadmin'].includes(role))
    return <Navigate to="/unauthorized" replace />

  const canExport = access_rights?.costing_carte?.export

  const alertBadge = (label, color) => (
    <span className={`ml-1 px-1 rounded text-white text-xs bg-${color}-600`}>{label}</span>
  )

  return (
    <div className="p-6 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Costing Carte</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <label className="flex flex-col text-sm">
          Type
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="plat">Plat</option>
            <option value="dessert">Dessert</option>
            <option value="boisson">Boisson</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Famille
          <select
            className="form-select"
            value={familleFilter}
            onChange={(e) => setFamilleFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            {(() => {
              const opts = []
              const source = Array.isArray(familles) ? familles : []
              for (const f of source) {
                opts.push(
                  <option key={f} value={f}>
                    {f}
                  </option>
                )
              }
              return opts
            })()}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Actif
          <select
            className="form-select"
            value={actifFilter}
            onChange={(e) => setActifFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </label>
        {canExport && (
          <>
            <Button variant="outline" onClick={() => exportExcel(filtered)}>
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => exportPdf(filtered)}>
              Export PDF
            </Button>
          </>
        )}
      </div>

      {settings ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded bg-white/10">
            Marge moyenne %: {kpis.marge.toFixed(2)}
          </div>
          <div className="p-4 rounded bg-white/10">
            Food cost moyen %: {kpis.food.toFixed(2)}
          </div>
          <div className="p-4 rounded bg-white/10">
            Fiches sous objectif: {kpis.under}
          </div>
        </div>
      ) : (
        <div className="mb-4 text-red-600">Objectifs non définis</div>
      )}

      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="p-4 text-red-600">{error.message}</div>}

      {!loading && !error && (
        <TableContainer>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-auto">
              <thead>
                <tr>
                  <th className="px-2 py-1">Nom fiche</th>
                  <th className="px-2 py-1">Type</th>
                  <th className="px-2 py-1">Coût/portion</th>
                  <th className="px-2 py-1">Prix vente</th>
                  <th className="px-2 py-1">Marge €</th>
                  <th className="px-2 py-1">Marge %</th>
                  <th className="px-2 py-1">Food cost %</th>
                  <th className="px-2 py-1">Alertes</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = []
                  for (const f of filtered) {
                    const alertMarge =
                      settings?.objectif_marge_pct != null &&
                      f.marge_pct < settings.objectif_marge_pct
                    const alertFood =
                      settings?.objectif_food_cost_pct != null &&
                      f.food_cost_pct > settings.objectif_food_cost_pct
                    rows.push(
                      <tr key={f.fiche_id}>
                        <td className="border px-2 py-1">{f.nom}</td>
                        <td className="border px-2 py-1">{f.type}</td>
                        <td className="border px-2 py-1 text-right">
                          {f.cout_par_portion?.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {f.prix_vente?.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {f.marge_euro?.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {f.marge_pct?.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {f.food_cost_pct?.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1">
                          {alertMarge && alertBadge('M', 'red')}
                          {alertFood && alertBadge('FC', 'orange')}
                        </td>
                      </tr>
                    )
                  }
                  if (rows.length === 0) {
                    rows.push(
                      <tr key="empty">
                        <td colSpan="8" className="p-4 text-center text-gray-500">
                          Aucune fiche
                        </td>
                      </tr>
                    )
                  }
                  return rows
                })()}
              </tbody>
            </table>
          </div>
        </TableContainer>
      )}
    </div>
  )
}

