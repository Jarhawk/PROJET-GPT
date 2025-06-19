import { useEffect } from "react";
import { useConsolidatedStats } from "@/hooks/useConsolidatedStats";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export default function StatsConsolidation() {
  const { stats, loading, error, fetchStats } = useConsolidatedStats();

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats), "Stats");
    XLSX.writeFile(wb, "consolidation_stats.xlsx");
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Consolidation multi-sites</h1>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>
        Export Excel
      </Button>
      <table className="min-w-full text-xs bg-white rounded-xl shadow-md">
        <thead>
          <tr>
            <th className="px-2 py-1">Établissement</th>
            <th className="px-2 py-1">Stock valorisé (€)</th>
            <th className="px-2 py-1">Conso mois (€)</th>
            <th className="px-2 py-1">Mouvements</th>
          </tr>
        </thead>
        <tbody>
          {stats.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-2 text-center text-gray-500">
                Aucune donnée
              </td>
            </tr>
          ) : (
            stats.map((s) => (
              <tr key={s.mama_id}>
                <td className="px-2 py-1 font-semibold">{s.nom}</td>
                <td className="px-2 py-1 text-right">{Number(s.stock_valorise).toLocaleString()}</td>
                <td className="px-2 py-1 text-right">{Number(s.conso_mois || 0).toLocaleString()}</td>
                <td className="px-2 py-1 text-right">{s.nb_mouvements}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
