import { useEffect, useState } from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export default function StatsStock() {
  const { stats, loading, error, fetchStats } = useDashboardStats({ pageSize: 1000 });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const arr = Array.isArray(stats) ? [...stats] : [];
    arr.sort((a, b) => a.nom.localeCompare(b.nom));
    setRows(arr);
  }, [stats]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Stocks");
    XLSX.writeFile(wb, "stocks_dashboard.xlsx");
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Stocks produits</h1>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>
        Export Excel
      </Button>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Stock réel</th>
              <th className="px-2 py-1">PMP</th>
              <th className="px-2 py-1">Dernier achat</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-2 text-center text-gray-500" colSpan="4">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.product_id}>
                  <td className="px-2 py-1">{r.nom}</td>
                  <td className="px-2 py-1 text-right">{Number(r.stock_reel ?? 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{Number(r.pmp ?? 0).toLocaleString()}</td>
                  <td className="px-2 py-1">
                    {r.last_purchase
                      ? new Date(r.last_purchase).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
