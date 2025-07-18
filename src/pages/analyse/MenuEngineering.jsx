// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/button'
import { useMenuEngineering } from '@/hooks/useMenuEngineering'
import FicheRentabiliteCard from '@/components/fiches/FicheRentabiliteCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function MenuEngineering() {
  const { data, fetchData } = useMenuEngineering()
  const [filters, setFilters] = useState({ famille: '', saison: '', chef: '' })

  useEffect(() => { fetchData(filters) }, [fetchData, filters])

  const median = arr => {
    const s = [...arr].sort((a, b) => a - b)
    return s.length ? s[Math.floor(s.length / 2)] : 0
  }

  const medianPop = median(data.map(d => d.x))
  const medianMarge = median(data.map(d => d.y))

  const exportPdf = async () => {
    const el = document.getElementById('matrix')
    if (!el) return
    const canvas = await html2canvas(el)
    const pdf = new jsPDF()
    const img = canvas.toDataURL('image/png')
    pdf.addImage(img, 'PNG', 10, 10, 190, 0)
    pdf.save('menu_engineering.pdf')
  }

  return (
    <div className="p-6 space-y-4 text-shadow">
      <h1 className="text-2xl font-bold">Menu Engineering</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <input className="input" placeholder="Famille" value={filters.famille} onChange={e => setFilters(f => ({ ...f, famille: e.target.value }))} />
        <input className="input" placeholder="Saison" value={filters.saison} onChange={e => setFilters(f => ({ ...f, saison: e.target.value }))} />
        <input className="input" placeholder="Chef" value={filters.chef} onChange={e => setFilters(f => ({ ...f, chef: e.target.value }))} />
        <Button onClick={() => fetchData(filters)}>Rafraîchir</Button>
        <Button variant="outline" onClick={exportPdf}>Export</Button>
      </div>
      <div id="matrix" className="w-full h-80 bg-glass border border-borderGlass backdrop-blur rounded">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Popularité" unit="%" />
            <YAxis type="number" dataKey="y" name="Marge" unit="%" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine x={medianPop} stroke="grey" />
            <ReferenceLine y={medianMarge} stroke="grey" />
            <Scatter data={data} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(f => <FicheRentabiliteCard key={f.id} fiche={f} />)}
      </div>
    </div>
  )
}
