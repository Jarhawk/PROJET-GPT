// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMenus } from '@/hooks/useMenus';
import { useSimulation } from '@/hooks/useSimulation';
import SimulationDetailsModal from '@/components/simulation/SimulationDetailsModal';
import Button from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import TableContainer from '@/components/ui/TableContainer';

export default function SimulationPlanner() {
  const { mama_id, loading: authLoading } = useAuth();
  const { getMenus } = useMenus();
  const { simulerBudget, loading } = useSimulation();

  const [periode, setPeriode] = useState({ start: '', end: '' });
  const [menus, setMenus] = useState([]);
  const [scenario, setScenario] = useState([]);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!mama_id) return;
    getMenus({ start: periode.start, end: periode.end }).then((data) =>
      setMenus(Array.isArray(data) ? data : [])
    );
  }, [mama_id, periode.start, periode.end]);

  const toggleMenu = (id) => {
    setScenario((prev) => {
      const next = [];
      let exists = false;
      for (let i = 0; i < prev.length; i++) {
        const s = prev[i];
        if (s.menu_id === id) {
          exists = true;
        } else {
          next.push(s);
        }
      }
      if (!exists) next.push({ menu_id: id, portions: 1 });
      return next;
    });
  };

  const handleSimulate = async () => {
    const res = await simulerBudget(periode, scenario);
    setResult(res);
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  const menuList = Array.isArray(menus) ? menus : [];
  const produits = Array.isArray(result?.produits) ? result.produits : [];
  const menuItems = [];
  for (let i = 0; i < menuList.length; i++) {
    const m = menuList[i];
    let checked = false;
    for (let j = 0; j < scenario.length; j++) {
      if (scenario[j].menu_id === m.id) {
        checked = true;
        break;
      }
    }
    menuItems.push(
      <label key={m.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleMenu(m.id)}
        />
        <span>
          {m.nom} ({m.date})
        </span>
      </label>
    );
  }
  const produitRows = [];
  for (let i = 0; i < produits.length; i++) {
    const p = produits[i];
    produitRows.push(
      <tr key={i}>
        <td className="px-2">{p.produit_nom || p.produit_id}</td>
        <td className="px-2">{p.quantite}</td>
        <td className="px-2">{p.valeur}</td>
      </tr>
    );
  }
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Simulation planning</h1>
      <div className="flex gap-2 items-end mb-4">
        <input
          type="date"
          className="form-input"
          value={periode.start}
          onChange={(e) => setPeriode((p) => ({ ...p, start: e.target.value }))}
        />
        <input
          type="date"
          className="form-input"
          value={periode.end}
          onChange={(e) => setPeriode((p) => ({ ...p, end: e.target.value }))}
        />
        <Button onClick={handleSimulate} disabled={loading}>
          Simuler
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">{menuItems}</div>
      {result && (
        <div className="mt-4">
          <TableContainer>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2">Produit</th>
                  <th className="px-2">Qté</th>
                  <th className="px-2">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {produitRows}
              </tbody>
            </table>
          </TableContainer>
          <div className="font-semibold">Total : {result.total} €</div>
          <Button className="mt-2" onClick={() => setOpen(true)}>
            Détails
          </Button>
        </div>
      )}
      <SimulationDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        result={result}
      />
    </div>
  );
}
