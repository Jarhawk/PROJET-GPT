import { useState, useEffect } from "react";
import { useCostCenterStats } from "@/hooks/useCostCenterStats";
import { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

export default function StatsCostCenters() {
  const { fetchStats } = useCostCenterStats();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(stats);
    XLSX.utils.book_append_sheet(wb, ws, 'Stats');
    XLSX.writeFile(wb, 'cost_center_stats.xlsx');
  };

  useEffect(() => {
    fetchStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [fetchStats]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const data = await fetchStats({
      debut: startDate || null,
      fin: endDate || null,
    });
    setStats(data);
    setLoading(false);
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Ventilation par Cost Center</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          type="date"
          className="input"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          aria-label="Date début"
        />
        <input
          type="date"
          className="input"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          aria-label="Date fin"
        />
        <button className="btn" type="submit">Filtrer</button>
        <button type="button" onClick={exportExcel} className="btn btn-outline">
          Export Excel
        </button>
      </form>
      <table className="min-w-full text-xs bg-white rounded-xl shadow-md">
        <thead>
          <tr>
            <th className="px-2 py-1">Cost Center</th>
            <th className="px-2 py-1">Quantité</th>
            <th className="px-2 py-1">Valeur €</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.cost_center_id}>
              <td className="px-2 py-1">{s.nom}</td>
              <td className="px-2 py-1">{Number(s.quantite).toLocaleString()}</td>
              <td className="px-2 py-1">{Number(s.valeur).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
