import { useEffect, useState } from 'react';
import { useMenuEngineering } from '@/hooks/useMenuEngineering';
import { Toaster, toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

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
  const { fetchData, saveVente } = useMenuEngineering();
  const { mama_id, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchData(periode).then(res => setRows(classify(res)));
    }
  }, [periode, fetchData, authLoading, mama_id]);

  const handleChange = async (fiche, val) => {
    await saveVente(fiche.id, periode, Number(val));
    toast.success('Ventes enregistrées');
    const res = await fetchData(periode);
    setRows(classify(res));
  };

  if (authLoading) return <div className="p-8">Chargement...</div>;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Menu Engineering</h1>
      <div className="flex items-center gap-2 mb-4">
        <input type="month" value={periode.slice(0,7)} onChange={e => setPeriode(e.target.value+'-01')} className="input" />
        <Button onClick={() => fetchData(periode).then(res => setRows(classify(res)))}>Rafraîchir</Button>
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
          {rows.map(r => (
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
    </div>
  );
}
