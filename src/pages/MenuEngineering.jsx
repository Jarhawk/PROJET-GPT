// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react'
import { useMenuEngineering } from '@/hooks/useMenuEngineering'
import { Toaster, toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import useAuth from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import FicheRentabiliteCard from '@/components/fiches/FicheRentabiliteCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function classify(items) {
  const ventes = items.map(i => i.ventes).sort((a,b)=>a-b);
  const fcVals = items.map(i => i.foodCost).filter(v=>v!=null).sort((a,b)=>a-b);
  const medVentes = ventes.length ? ventes[Math.floor(ventes.length/2)] : 0;
  const medFC = fcVals.length ? fcVals[Math.floor(fcVals.length/2)] : 0;
  return items.map(it => {
    let cls;
    if (it.ventes >= medVentes && it.foodCost <= medFC) cls = 'Star';
    else if (it.ventes >= medVentes && it.foodCost > medFC) cls = 'Plow Horse';
    else if (it.ventes < medVentes && it.foodCost <= medFC) cls = 'Puzzle';
    else cls = 'Dog';
    return { ...it, classement: cls };
  });
}

export default function MenuEngineering() {
  const [periode, setPeriode] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  });
  const { fetchData, saveVente } = useMenuEngineering()
  const { mama_id, loading: authLoading } = useAuth()
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState({ categorie: '', performance: '', marge: '' })

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchData(periode).then(res => setRows(classify(res)))
    }
  }, [periode, fetchData, authLoading, mama_id])

  const handleChange = async (fiche, val) => {
    await saveVente(fiche.id, periode, Number(val));
    toast.success('Ventes enregistrées');
    const res = await fetchData(periode);
    setRows(classify(res));
  };

  const filtered = rows.filter(r => {
    if (filters.categorie && r.famille !== filters.categorie) return false
    if (filters.performance && r.classement !== filters.performance) return false
    if (filters.marge && r.marge < Number(filters.marge)) return false
    return true
  })

  const median = arr => {
    const s = [...arr].sort((a,b) => a - b)
    return s.length ? s[Math.floor(s.length / 2)] : 0
  }

  const medianPop = median(filtered.map(d => d.popularite * 100))
  const medianMarge = median(filtered.map(d => d.marge))

  const exportPdf = async () => {
    const el = document.getElementById('matrix')
    if (!el) return
    const canvas = await html2canvas(el)
    const pdf = new jsPDF()
    const img = canvas.toDataURL('image/png')
    pdf.addImage(img, 'PNG', 10, 10, 190, 0)
    pdf.save('menu_engineering.pdf')
  }

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-4">
      <Toaster />
      <h1 className="text-2xl font-bold">Menu Engineering</h1>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={periode.slice(0, 7)}
          onChange={e => setPeriode(e.target.value + '-01')}
          className="input"
        />
        <input
          className="input"
          placeholder="Catégorie"
          value={filters.categorie}
          onChange={e => setFilters(f => ({ ...f, categorie: e.target.value }))}
        />
        <select
          className="input"
          value={filters.performance}
          onChange={e => setFilters(f => ({ ...f, performance: e.target.value }))}
        >
          <option value="">Toutes</option>
          <option value="Star">Star</option>
          <option value="Plow Horse">Plow Horse</option>
          <option value="Puzzle">Puzzle</option>
          <option value="Dog">Dog</option>
        </select>
        <input
          type="number"
          placeholder="Marge >="
          className="input w-24"
          value={filters.marge}
          onChange={e => setFilters(f => ({ ...f, marge: e.target.value }))}
        />
        <Button onClick={() => fetchData(periode).then(res => setRows(classify(res)))}>
          Rafraîchir
        </Button>
        <Button variant="outline" onClick={exportPdf}>Export</Button>
      </div>
      <div id="matrix" className="w-full h-80 bg-white/10 border border-white/20 backdrop-blur-xl rounded">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Popularité" unit="%" />
            <YAxis type="number" dataKey="y" name="Marge" unit="%" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine x={medianPop} stroke="grey" />
            <ReferenceLine y={medianMarge} stroke="grey" />
            <Scatter data={filtered} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-2 py-1">Nom</th>
            <th className="px-2 py-1">Catégorie</th>
            <th className="px-2 py-1">Prix vente</th>
            <th className="px-2 py-1">Coût</th>
            <th className="px-2 py-1">Food cost %</th>
            <th className="px-2 py-1">Ventes</th>
            <th className="px-2 py-1">Classement</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id}>
              <td className="px-2 py-1">{r.nom}</td>
              <td className="px-2 py-1">{r.famille || '-'}</td>
              <td className="px-2 py-1">{r.prix_vente ? Number(r.prix_vente).toFixed(2) : '-'}</td>
              <td className="px-2 py-1">{r.cout_portion ? Number(r.cout_portion).toFixed(2) : '-'}</td>
              <td className="px-2 py-1">{r.foodCost ? r.foodCost.toFixed(1) : '-'}</td>
              <td className="px-2 py-1">
                <input type="number" className="input w-20" value={r.ventes} onChange={e => handleChange(r, e.target.value)} />
              </td>
              <td className="px-2 py-1">{r.classement}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filtered.map(f => (
          <FicheRentabiliteCard key={f.id} fiche={f} />
        ))}
      </div>
    </div>
  );
}
