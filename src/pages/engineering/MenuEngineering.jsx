// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useMenuEngineering } from '@/hooks/useMenuEngineering'
import EngineeringFilters from '@/components/engineering/EngineeringFilters'
import EngineeringChart from '@/components/engineering/EngineeringChart'
import ImportVentesExcel from '@/components/engineering/ImportVentesExcel'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

export default function MenuEngineering() {
  const { mama_id, roles = [], loading: authLoading } = useAuth()
  const { fetchData, saveVente } = useMenuEngineering()
  const [filters, setFilters] = useState(() => {
    const d = new Date()
    return { periode: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, famille: '', actif: '' }
  })
  const [rows, setRows] = useState([])
  const [chartType, setChartType] = useState('matrix')

  useEffect(() => {
    if (!mama_id) return
    fetchData(filters.periode, filters).then(setRows)
  }, [mama_id, filters, fetchData])

  const handleVentesChange = async (fiche, val) => {
    await saveVente(fiche.id, filters.periode, Number(val))
    toast.success('Ventes enregistrées')
    const res = await fetchData(filters.periode, filters)
    setRows(res)
  }

  const handleImport = async items => {
    for (const it of items) {
      if (it.fiche_id) await saveVente(it.fiche_id, filters.periode, Number(it.ventes || 0))
    }
    const res = await fetchData(filters.periode, filters)
    setRows(res)
    toast.success('Import réussi')
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'engineering')
    XLSX.writeFile(wb, 'menu_engineering.xlsx')
  }

  const exportPdf = async () => {
    const el = document.getElementById('chart-container')
    if (!el) return
    const canvas = await html2canvas(el)
    const pdf = new jsPDF()
    const img = canvas.toDataURL('image/png')
    pdf.addImage(img, 'PNG', 10, 10, 190, 0)
    pdf.save('menu_engineering.pdf')
  }

  if (authLoading) return <LoadingSpinner message="Chargement..." />
  if (!mama_id || !roles.some(r => ['admin', 'manager'].includes(r))) return null

  return (
    <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Menu Engineering</h1>
      <EngineeringFilters filters={filters} onChange={setFilters} />
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => setChartType('matrix')}>Quadrillage</Button>
        <Button onClick={() => setChartType('heatmap')}>Heatmap</Button>
        <Button onClick={() => setChartType('radar')}>Radar</Button>
        <Button onClick={() => setChartType('histogram')}>Histogramme</Button>
        <ImportVentesExcel onImport={handleImport} />
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button variant="outline" onClick={exportPdf}>Export PDF</Button>
      </div>
      <div id="chart-container" className="w-full h-80 bg-white/10 border border-white/20 backdrop-blur-xl rounded">
        <EngineeringChart data={rows} type={chartType} />
      </div>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-2 py-1">Nom</th>
            <th className="px-2 py-1">Famille</th>
            <th className="px-2 py-1">Prix vente</th>
            <th className="px-2 py-1">Coût</th>
            <th className="px-2 py-1">Marge €</th>
            <th className="px-2 py-1">Marge %</th>
            <th className="px-2 py-1">Ventes</th>
            <th className="px-2 py-1">CA simulé</th>
            <th className="px-2 py-1">Popularité</th>
            <th className="px-2 py-1">Catégorie</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="px-2 py-1">{r.nom}</td>
              <td className="px-2 py-1">{r.famille || '-'}</td>
              <td className="px-2 py-1">{r.prix_vente?.toFixed(2)}</td>
              <td className="px-2 py-1">{r.cout_portion?.toFixed(2)}</td>
              <td className="px-2 py-1">{r.margeEuro?.toFixed(2)}</td>
              <td className="px-2 py-1">{r.marge?.toFixed(1)}</td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  className="input w-20"
                  value={r.ventes}
                  onChange={e => handleVentesChange(r, e.target.value)}
                />
              </td>
              <td className="px-2 py-1">{(r.ca).toFixed(2)}</td>
              <td className="px-2 py-1">{(r.popularite * 100).toFixed(1)}%</td>
              <td className="px-2 py-1">{r.classement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
