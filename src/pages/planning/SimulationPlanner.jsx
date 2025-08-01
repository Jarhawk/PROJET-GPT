// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { useMenus } from "@/hooks/useMenus";
import { useSimulation } from "@/hooks/useSimulation";
import SimulationDetailsModal from "@/components/simulation/SimulationDetailsModal";
import Button from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";

export default function SimulationPlanner() {
  const { mama_id, loading: authLoading } = useAuth();
  const { getMenus } = useMenus();
  const { simulerBudget, loading } = useSimulation();

  const [periode, setPeriode] = useState({ start: "", end: "" });
  const [menus, setMenus] = useState([]);
  const [scenario, setScenario] = useState([]);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!mama_id) return;
    getMenus({ start: periode.start, end: periode.end }).then(setMenus);
  }, [mama_id, periode.start, periode.end]);

  const toggleMenu = (id) => {
    setScenario((prev) => {
      const existing = prev.find((s) => s.menu_id === id);
      if (existing) return prev.filter((s) => s.menu_id !== id);
      return [...prev, { menu_id: id, portions: 1 }];
    });
  };

  const handleSimulate = async () => {
    const res = await simulerBudget(periode, scenario);
    setResult(res);
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

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
        <Button onClick={handleSimulate} disabled={loading}>Simuler</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {menus.map((m) => (
          <label key={m.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!scenario.find((s) => s.menu_id === m.id)}
              onChange={() => toggleMenu(m.id)}
            />
            <span>{m.nom} ({m.date})</span>
          </label>
        ))}
      </div>
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
              {result.produits.map((p, idx) => (
                <tr key={idx}>
                  <td className="px-2">{p.produit_nom || p.produit_id}</td>
                  <td className="px-2">{p.quantite}</td>
                  <td className="px-2">{p.valeur}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </TableContainer>
          <div className="font-semibold">Total : {result.total} €</div>
          <Button className="mt-2" onClick={() => setOpen(true)}>
            Détails
          </Button>
        </div>
      )}
      <SimulationDetailsModal open={open} onClose={() => setOpen(false)} result={result} />
    </div>
  );
}
