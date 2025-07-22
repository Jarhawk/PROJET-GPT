// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useCostCenterMonthlyStats } from "@/hooks/useCostCenterMonthlyStats";
import useAuth from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import * as XLSX from "xlsx";

export default function StatsCostCentersPivot() {
  const { fetchMonthly } = useCostCenterMonthlyStats();
  const { mama_id, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);

  const exportExcel = () => {
    const data = rows.map(r => {
      const obj = { nom: r.nom };
      months.forEach(m => { obj[m] = r[m] || 0; });
      return obj;
    });
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

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Ventilation mensuelle par Cost Center</h1>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>Export Excel</Button>
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Cost Center</th>
              {months.map((m) => (
                <th key={m} className="px-2 py-1">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={months.length + 1} className="p-2 text-center text-gray-500">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 font-semibold">{row.nom}</td>
                  {months.map((m) => (
                    <td key={m} className="px-2 py-1 text-right">{row[m]?.toLocaleString() || '-'}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
