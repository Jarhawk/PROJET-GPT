import { useEffect, useState } from "react";
import { useSupplierStats } from "@/hooks/useSupplierStats";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function SupplierDetail({ supplier, onClose }) {
  const { stats, fetchStats } = useSupplierStats();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats(supplier.id);
    // eslint-disable-next-line
  }, [supplier.id]);

  // Export stats Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(stats || []);
    XLSX.utils.book_append_sheet(wb, ws, "Stats");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `stats_${supplier.nom}.xlsx`);
  };

  // Export PDF (à brancher jsPDF)
  const exportPDF = () => {
    toast.success("Export PDF non implémenté (brancher jsPDF)");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{supplier.nom}</h2>
        <div><b>Ville :</b> {supplier.ville}</div>
        <div><b>Téléphone :</b> {supplier.telephone}</div>
        <div>
          <b>Document/Logo :</b> {supplier.document ?
            <a href={supplier.document} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir</a> :
            <span className="text-gray-400">Aucun</span>
          }
        </div>
        <div className="my-4">
          <h3 className="font-bold mb-2">Statistiques Achats / Factures</h3>
          <table className="min-w-full bg-gray-50 rounded">
            <thead>
              <tr>
                <th>Période</th>
                <th>Nb factures</th>
                <th>Montant total</th>
                <th>Dernier achat</th>
              </tr>
            </thead>
            <tbody>
              {stats && stats.length > 0 ? stats.map((stat, i) => (
                <tr key={i}>
                  <td>{stat.periode}</td>
                  <td>{stat.nb_factures}</td>
                  <td>{stat.montant_total?.toFixed(2)} €</td>
                  <td>{stat.dernier_achat ? new Date(stat.dernier_achat).toLocaleDateString() : "-"}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="text-gray-400">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>
    </div>
  );
}
