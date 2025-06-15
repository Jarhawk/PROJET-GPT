import { useEffect, useState } from "react";
import { useCostCenterMonthlyStats } from "@/hooks/useCostCenterMonthlyStats";
import { Toaster } from "react-hot-toast";

export default function StatsCostCentersPivot() {
  const { fetchMonthly } = useCostCenterMonthlyStats();
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);

  useEffect(() => {
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
  }, [fetchMonthly]);

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Ventilation mensuelle par Cost Center</h1>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Cost Center</th>
              {months.map(m => (
                <th key={m} className="px-2 py-1">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,i) => (
              <tr key={i}>
                <td className="px-2 py-1 font-semibold">{row.nom}</td>
                {months.map(m => (
                  <td key={m} className="px-2 py-1 text-right">{row[m]?.toLocaleString() || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
