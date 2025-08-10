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
    data,
    settings,
    loading,
    error,
    fetchCosting,
    fetchSettings,
    exportExcel,
    exportPdf,
  } = useCostingCarte()

  const [typeFilter, setTypeFilter] = useState('')
  const [familleFilter, setFamilleFilter] = useState('')
  const [actifFilter, setActifFilter] = useState('')

  useEffect(() => {
    fetchCosting({})
    fetchSettings()
  }, [fetchCosting, fetchSettings])

  const familles = useMemo(
    () => Array.from(new Set(data.map((f) => f.famille).filter(Boolean))).sort(),
    [data]
  )

  const filtered = data
    .filter((f) => (!typeFilter || f.type === typeFilter))
    .filter((f) => (!familleFilter || f.famille === familleFilter))
    .filter((f) => (actifFilter === '' ? true : f.actif === (actifFilter === 'true')))

  const kpis = useMemo(() => {
    if (filtered.length === 0) return { marge: 0, food: 0, under: 0 }
    const avgMarge =
      filtered.reduce((sum, f) => sum + (f.marge_pct || 0), 0) / filtered.length
    const avgFood =
      filtered.reduce((sum, f) => sum + (f.food_cost_pct || 0), 0) /
      filtered.length
    const under = filtered.filter(
      (f) =>
        (settings?.objectif_marge_pct &&
          f.marge_pct < settings.objectif_marge_pct) ||
        (settings?.objectif_food_cost_pct &&
          f.food_cost_pct > settings.objectif_food_cost_pct)
    ).length
    return { marge: avgMarge, food: avgFood, under }
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
            {familles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
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
                {filtered.map((f) => {
                  const alertMarge =
                    settings?.objectif_marge_pct != null &&
                    f.marge_pct < settings.objectif_marge_pct
                  const alertFood =
                    settings?.objectif_food_cost_pct != null &&
                    f.food_cost_pct > settings.objectif_food_cost_pct
                  return (
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
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-4 text-center text-gray-500"
                    >
                      Aucune fiche
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableContainer>
      )}
    </div>
  )
}

