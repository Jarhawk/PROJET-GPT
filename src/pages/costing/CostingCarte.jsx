// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { useCostingCarte } from '@/hooks/useCostingCarte'
import TableContainer from '@/components/ui/TableContainer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'

export default function CostingCarte() {
  const { hasAccess, nom } = useAuth()
  const canView = hasAccess('costing_carte', 'lecture')
  const canExport = hasAccess('costing_carte', 'export')
  const { rows, settings, loading, error, fetchCosting, fetchSettings, exportExcel, exportPdf } = useCostingCarte()
  const [filters, setFilters] = useState({ type: '', famille: '', actif: true })

  useEffect(() => { fetchCosting(filters) }, [fetchCosting, filters])
  useEffect(() => { fetchSettings() }, [fetchSettings])

  const familles = useMemo(() => Array.from(new Set(rows.map(r => r.famille).filter(Boolean))).sort(), [rows])

  const margeMoy = rows.length ? rows.reduce((s, r) => s + (r.marge_pct || 0), 0) / rows.length : 0
  const fcMoy = rows.length ? rows.reduce((s, r) => s + (r.food_cost_pct || 0), 0) / rows.length : 0
  const sousObjectif = rows.filter(r =>
    (settings?.objectif_marge_pct && r.marge_pct < settings.objectif_marge_pct) ||
    (settings?.objectif_food_cost_pct && r.food_cost_pct > settings.objectif_food_cost_pct)
  ).length

  if (!canView) return <Navigate to="/unauthorized" replace />
  if (loading) return <LoadingSpinner message="Chargement..." />
  if (error) return <div className="p-6 text-red-600">{error.message || error.toString()}</div>
  if (!settings) return <div className="p-6">Objectifs non définis</div>

  const handleExportExcel = () => exportExcel(rows)
  const handleExportPdf = () => exportPdf(rows, { mamaName: nom })

  return (
    <div className="p-6 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Costing Carte</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <label className="flex flex-col text-sm">
          Type
          <select className="form-select" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">Tous</option>
            <option value="entrée">Entrée</option>
            <option value="plat">Plat</option>
            <option value="dessert">Dessert</option>
            <option value="boisson">Boisson</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Famille
          <select className="form-select" value={filters.famille} onChange={e => setFilters(f => ({ ...f, famille: e.target.value }))}>
            <option value="">Toutes</option>
            {familles.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Actif
          <select className="form-select" value={String(filters.actif)} onChange={e => setFilters(f => ({ ...f, actif: e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined }))}>
            <option value="true">Oui</option>
            <option value="false">Non</option>
            <option value="undefined">Tous</option>
          </select>
        </label>
        {canExport && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>Export Excel</Button>
            <Button variant="outline" onClick={handleExportPdf}>Export PDF</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white/5 rounded">
          <p className="text-sm text-gray-300">Marge moyenne %</p>
          <p className="text-xl font-semibold">{margeMoy.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white/5 rounded">
          <p className="text-sm text-gray-300">Food cost moyen %</p>
          <p className="text-xl font-semibold">{fcMoy.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white/5 rounded">
          <p className="text-sm text-gray-300">Fiches sous objectif</p>
          <p className="text-xl font-semibold">{sousObjectif}</p>
        </div>
      </div>

      <TableContainer>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-auto">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Nom fiche</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1 text-right">Coût/portion</th>
                <th className="px-2 py-1 text-right">Prix vente</th>
                <th className="px-2 py-1 text-right">Marge €</th>
                <th className="px-2 py-1 text-right">Marge %</th>
                <th className="px-2 py-1 text-right">Food cost %</th>
                <th className="px-2 py-1">Alertes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const alMarge = settings.objectif_marge_pct && r.marge_pct < settings.objectif_marge_pct
                const alFc = settings.objectif_food_cost_pct && r.food_cost_pct > settings.objectif_food_cost_pct
                return (
                  <tr key={r.fiche_id}>
                    <td className="border px-2 py-1">{r.nom}</td>
                    <td className="border px-2 py-1">{r.type}</td>
                    <td className="border px-2 py-1 text-right">{Number(r.cout_par_portion || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-right">{Number(r.prix_vente || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-right">{Number(r.marge_euro || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-right">{Number(r.marge_pct || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-right">{Number(r.food_cost_pct || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-center">
                      {alMarge && <span className="bg-red-600 text-white px-1 rounded mr-1">M</span>}
                      {alFc && <span className="bg-orange-500 text-white px-1 rounded">FC</span>}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">Aucune fiche</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableContainer>
    </div>
  )
}
