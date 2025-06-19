import { useState, useEffect } from "react";
import { useCostCenterStats } from "@/hooks/useCostCenterStats";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export default function StatsCostCenters() {
  const { fetchStats } = useCostCenterStats();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Ventilation par Cost Center</h1>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>
        Export Excel
      </Button>
      <table className="min-w-full text-xs bg-white rounded-xl shadow-md">
        <caption className="sr-only">Stats par cost center</caption>
        <thead>
          <tr>
            <th className="px-2 py-1">Cost Center</th>
            <th className="px-2 py-1">Quantité</th>
            <th className="px-2 py-1">Valeur €</th>
          </tr>
        </thead>
        <tbody>
          {stats.length === 0 ? (
            <tr>
              <td colSpan="3" className="p-2 text-center text-gray-500">
                Aucune donnée
              </td>
            </tr>
          ) : (
            stats.map((s) => (
              <tr key={s.cost_center_id}>
                <td className="px-2 py-1">{s.nom}</td>
                <td className="px-2 py-1">{Number(s.quantite).toLocaleString()}</td>
                <td className="px-2 py-1">{Number(s.valeur).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
