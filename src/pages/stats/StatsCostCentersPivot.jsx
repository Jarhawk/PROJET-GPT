// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useCostCenterMonthlyStats } from "@/hooks/useCostCenterMonthlyStats";
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import * as XLSX from "xlsx";

export default function StatsCostCentersPivot() {
  const { fetchMonthly } = useCostCenterMonthlyStats();
  const { mama_id, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);

  const exportExcel = () => {
    const data = [];
    const list = Array.isArray(rows) ? rows : [];
    const mths = Array.isArray(months) ? months : [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      const obj = { nom: r.nom };
      for (let j = 0; j < mths.length; j++) {
        const m = mths[j];
        obj[m] = r[m] || 0;
      }
      data.push(obj);
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Stats');
    XLSX.writeFile(wb, 'cost_center_monthly.xlsx');
  };

  useEffect(() => {
    if (!mama_id || authLoading) return;
    fetchMonthly().then(data => {
      const moisSet = new Set();
      data.forEach(d => moisSet.add(d.mois.slice(0,7)));
      const sortedMonths = Array.from(moisSet).sort();
      const grouped = {};
      data.forEach(d => {
        const key = d.cost_center_id;
        if (!grouped[key]) grouped[key] = { nom: d.nom };
        grouped[key][d.mois.slice(0,7)] = Number(d.valeur);
      });
      setMonths(sortedMonths);
      setRows(Object.values(grouped));
    });
  }, [fetchMonthly, mama_id, authLoading]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-8 container mx-auto">
            <h1 className="text-2xl font-bold mb-4">Ventilation mensuelle par Cost Center</h1>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>Export Excel</Button>
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Cost Center</th>
              {(() => {
                const headers = [];
                const mths = Array.isArray(months) ? months : [];
                for (let i = 0; i < mths.length; i++) {
                  const m = mths[i];
                  headers.push(
                    <th key={m} className="px-2 py-1">{m}</th>
                  );
                }
                return headers;
              })()}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const mths = Array.isArray(months) ? months : [];
              const list = Array.isArray(rows) ? rows : [];
              if (list.length === 0) {
                return (
                  <tr>
                    <td colSpan={mths.length + 1} className="p-2 text-center text-gray-500">
                      Aucune donnée
                    </td>
                  </tr>
                );
              }
              const body = [];
              for (let i = 0; i < list.length; i++) {
                const row = list[i];
                const cells = [];
                for (let j = 0; j < mths.length; j++) {
                  const m = mths[j];
                  cells.push(
                    <td key={m} className="px-2 py-1 text-right">{row[m]?.toLocaleString() || '-'}</td>
                  );
                }
                body.push(
                  <tr key={i}>
                    <td className="px-2 py-1 font-semibold">{row.nom}</td>
                    {cells}
                  </tr>
                );
              }
              return body;
            })()}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
