// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/produits/ProduitDetail.jsx
import { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import ModalGlass from "@/components/ui/ModalGlass";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { buildPriceData } from "./priceHelpers";

export default function ProduitDetail({ produitId, open, onClose }) {
  const { fetchProductPrices } = useProducts();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (open && produitId) {
      setLoading(true);
      fetchProductPrices(produitId).then(h => {
        if (!active) return;
        setHistorique(h || []);
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [open, produitId, fetchProductPrices]);

  const chartData = buildPriceData(historique);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historique), "Prix");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `prix_produit_${produitId}.xlsx`);
  };

  return (
    <ModalGlass open={open} onClose={onClose}>
        <h2 className="text-lg font-bold text-mamastockGold mb-3">Historique des prix d’achat</h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner message="Chargement..." />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Prix (€)</th>
                <th>Dernière livraison</th>
              </tr>
            </thead>
            <tbody>
              {historique.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Aucune donnée</td></tr>
              ) : historique.map((h, i) => (
                <tr key={i}>
                  <td>{h.created_at?.slice(0, 10) || "-"}</td>
                  <td>{h.fournisseur?.nom || "-"}</td>
                  <td>{h.prix_achat ?? "-"}</td>
                  <td>{h.derniere_livraison?.slice(0, 10) || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {chartData.length > 0 && (
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                {Object.keys(chartData[0]).filter(k => k !== 'date').map(key => (
                  <Line key={key} type="monotone" dataKey={key} stroke="#bfa14d" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={exportExcel} className="btn btn-secondary">Export Excel</button>
          <button onClick={onClose} className="btn">Fermer</button>
        </div>
    </ModalGlass>
  );
}
