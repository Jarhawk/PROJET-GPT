// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import useConsolidation from "@/hooks/useConsolidation";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Consolidation() {
  const {
    sites,
    data,
    loading,
    error,
    fetchSites,
    fetchConsoMensuelle,
    exportExcel,
    getKpis,
  } = useConsolidation();
  const [selected, setSelected] = useState([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    fetchSites().then((rows) => setSelected(rows.map((r) => r.id)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = () => {
    fetchConsoMensuelle({ mamaIds: selected, start, end });
  };

  const kpis = getKpis();

  return (
    <div className="p-8 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Consolidation multi-sites</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <div>
          <label className="block text-xs">Début</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs">Fin</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border px-2 py-1 text-sm"
          />
        </div>
        <Button onClick={load}>Charger</Button>
        <Button variant="outline" onClick={() => exportExcel(data)}>
          Export Excel
        </Button>
      </div>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-4 text-sm">
        <p>CA total: {kpis.ca.toFixed(2)}</p>
        <p>Achats totaux: {kpis.achats.toFixed(2)}</p>
        <p>Food cost menus: {kpis.foodcost.toFixed(2)}</p>
        <p>Marge carte moyenne: {kpis.margeCarte ? kpis.margeCarte.toFixed(2) : "-"}</p>
        <p>Écarts inventaire: {kpis.ecarts.toFixed(2)}</p>
      </div>
      <TableContainer>
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Site</th>
              <th className="px-2 py-1">Mois</th>
              <th className="px-2 py-1">CA</th>
              <th className="px-2 py-1">Achats</th>
              <th className="px-2 py-1">FoodCost</th>
              <th className="px-2 py-1">Marge%</th>
              <th className="px-2 py-1">Écarts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.mama_id}-${row.mois}`}>
                <td className="px-2 py-1">
                  {sites.find((s) => s.id === row.mama_id)?.nom || row.mama_id}
                </td>
                <td className="px-2 py-1">{row.mois}</td>
                <td className="px-2 py-1 text-right">
                  {Number(row.ca_total).toLocaleString()}
                </td>
                <td className="px-2 py-1 text-right">
                  {Number(row.achats_total).toLocaleString()}
                </td>
                <td className="px-2 py-1 text-right">
                  {Number(row.menu_foodcost_total).toLocaleString()}
                </td>
                <td className="px-2 py-1 text-right">
                  {row.marge_pct_moy ? row.marge_pct_moy.toFixed(2) : ""}
                </td>
                <td className="px-2 py-1 text-right">
                  {Number(row.ecart_valorise_total).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
