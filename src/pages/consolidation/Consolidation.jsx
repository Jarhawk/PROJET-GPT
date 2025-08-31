// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useConsolidation } from "@/hooks/useConsolidation";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Consolidation() {
  const {
    sites,
    rows,
    loading,
    fetchSites,
    fetchConsoMensuelle,
    exportExcel,
    exportPdf,
    getKpis,
  } = useConsolidation();
  const [selected, setSelected] = useState([]);
  const [period, setPeriod] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleSelect = (e) => {
    const opts = [];
    const options = e.target.selectedOptions;
    for (let i = 0; i < options.length; i++) {
      opts.push(options[i].value);
    }
    setSelected(opts);
  };

  const load = () => {
    fetchConsoMensuelle({ mamaIds: selected, start: period.start, end: period.end });
  };

  const safeSites = Array.isArray(sites) ? sites : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const kpis = getKpis(safeRows);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Consolidation</h1>
      <div className="flex flex-col md:flex-row gap-2">
        <select
          multiple
          value={selected}
          onChange={handleSelect}
          className="border p-1 flex-1 min-h-[5rem]"
        >
          {(() => {
            const items = [];
            for (const s of safeSites) {
              items.push(
                <option key={s.mama_id} value={s.mama_id}>
                  {s.mama_id}
                </option>
              );
            }
            return items;
          })()}
        </select>
        <input
          type="month"
          value={period.start}
          onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
          className="border p-1"
        />
        <input
          type="month"
          value={period.end}
          onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
          className="border p-1"
        />
        <Button onClick={load}>Charger</Button>
        <Button variant="outline" onClick={() => exportExcel(safeRows)}>
          Excel
        </Button>
        <Button variant="outline" onClick={() => exportPdf(safeRows)}>
          PDF
        </Button>
      </div>
      <div className="flex gap-4 text-sm">
        <div>CA: {kpis.ca}</div>
        <div>Achats: {kpis.achats}</div>
        <div>FoodCost: {kpis.menu_foodcost}</div>
        <div>Marge carte %: {kpis.marge_pct.toFixed ? kpis.marge_pct.toFixed(2) : kpis.marge_pct}</div>
        <div>Écarts: {kpis.ecarts}</div>
      </div>
      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : (
        <TableContainer>
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th>Site</th>
                <th>Mois</th>
                <th>CA</th>
                <th>Achats</th>
                <th>FoodCostMenus</th>
                <th>MargeCarte%</th>
                <th>ÉcartsInv</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rowsEls = [];
                for (const r of safeRows) {
                  rowsEls.push(
                    <tr key={`${r.mama_id}-${r.mois}`}>
                      <td>{r.mama_id}</td>
                      <td>{r.mois}</td>
                      <td>{r.ca_total}</td>
                      <td>{r.achats_total}</td>
                      <td>{r.menu_foodcost_total}</td>
                      <td>{r.marge_pct_moy}</td>
                      <td>{r.ecart_valorise_total}</td>
                    </tr>
                  );
                }
                return rowsEls;
              })()}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
