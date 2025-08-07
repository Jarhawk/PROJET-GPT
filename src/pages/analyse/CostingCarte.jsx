// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { useCostingCarte } from '@/hooks/useCostingCarte'
import TableContainer from '@/components/ui/TableContainer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'

const DEFAULT_SEUIL = 35

export default function CostingCarte() {
  const { role, loading: authLoading } = useAuth()
  const { fiches, loading, error, fetchFichesPourLaCarte } = useCostingCarte()
  const [typeFilter, setTypeFilter] = useState('')
  const [familleFilter, setFamilleFilter] = useState('')
  const [seuil, setSeuil] = useState(DEFAULT_SEUIL)
  const [sortKey, setSortKey] = useState('nom')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => { fetchFichesPourLaCarte() }, [fetchFichesPourLaCarte])

  const familles = useMemo(() => Array.from(new Set(fiches.map(f => f.famille).filter(Boolean))).sort(), [fiches])

  const filtered = fiches
    .filter(f => (!typeFilter || f.type === typeFilter))
    .filter(f => (!familleFilter || f.famille === familleFilter))
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'nom') return a.nom.localeCompare(b.nom) * dir
    return (a[sortKey] - b[sortKey]) * dir
  })

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sorted), 'Costing')
    XLSX.writeFile(wb, 'costing_carte.xlsx')
  }

  if (authLoading) return <LoadingSpinner message="Chargement..." />
  if (!['manager', 'admin', 'superadmin'].includes(role)) return <Navigate to="/unauthorized" replace />
  if (loading) return <LoadingSpinner message="Chargement..." />
  if (error) return <div className="p-8 text-red-600">{error.message || error.toString()}</div>

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="p-6 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Analyse coût carte</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <label className="flex flex-col text-sm">
          Type
          <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="plat">Plat</option>
            <option value="boisson">Boisson</option>
            <option value="dessert">Dessert</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Famille
          <select className="form-select" value={familleFilter} onChange={e => setFamilleFilter(e.target.value)}>
            <option value="">Toutes</option>
            {familles.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Seuil FC%
          <input type="number" className="form-input" value={seuil} onChange={e => setSeuil(Number(e.target.value))} />
        </label>
        <Button variant="outline" onClick={exportExcel}>Exporter</Button>
      </div>
      <TableContainer>
        <table className="min-w-full text-sm table-auto">
          <thead>
            <tr>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('nom')}>Nom</th>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('type')}>Type</th>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('famille')}>Famille</th>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('cout_unitaire')}>Coût unitaire</th>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('prix_vente')}>Prix vente</th>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('marge_brute')}>Marge</th>
              <th className="px-2 py-1 cursor-pointer" onClick={() => toggleSort('taux_food_cost')}>Taux %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(f => {
              const fc = f.taux_food_cost
              const rowClass = fc > seuil ? 'text-red-600' : ''
              return (
                <tr key={f.id} className={rowClass}>
                  <td className="border px-2 py-1">{f.nom}</td>
                  <td className="border px-2 py-1">{f.type}</td>
                  <td className="border px-2 py-1">{f.famille}</td>
                  <td className="border px-2 py-1 text-right">{f.cout_unitaire.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{f.prix_vente.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{f.marge_brute.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{fc.toFixed(1)}</td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">Aucune fiche</td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  )
}
