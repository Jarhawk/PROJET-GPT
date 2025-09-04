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
  const { fetchProductPrices, fetchProductMouvements, fetchProductStock } =
    useProducts();
  const [historique, setHistorique] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (open && produitId) {
      setLoading(true);
      Promise.all([
        fetchProductPrices(produitId),
        fetchProductMouvements(produitId),
        fetchProductStock(produitId),
      ]).then(([h, m, s]) => {
        if (!active) return;
        setHistorique(h || []);
        setMouvements(m || []);
        setStock(s);
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [open, produitId, fetchProductPrices, fetchProductMouvements, fetchProductStock]);

  const chartData = buildPriceData(historique);
  const summary = Object.values(
    historique.reduce((acc, h) => {
      const idF = h.fournisseur?.id || "";
      if (!acc[idF]) {
        acc[idF] = {
          nom: h.fournisseur?.nom || "Inconnu",
          count: 0,
          total: 0,
          lastPrice: null,
          lastDate: null,
        };
      }
      const cur = acc[idF];
      cur.count += 1;
      if (typeof h.prix_achat === "number") {
        cur.total += Number(h.prix_achat);
      }
      if (!cur.lastDate || new Date(h.created_at) > new Date(cur.lastDate)) {
        cur.lastDate = h.created_at;
        cur.lastPrice = h.prix_achat;
      }
      return acc;
    }, {})
  ).map((s) => ({
    ...s,
    prix_moyen: s.count ? s.total / s.count : null,
  }));

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historique), "Prix");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `prix_produit_${produitId}.xlsx`);
  };

  return (
    <ModalGlass open={open} onClose={onClose}>
      <h2 className="text-lg font-bold text-mamastockGold mb-3">Détails produit</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner message="Chargement..." />
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm">Quantité théorique : {stock ?? "-"}</p>
          <h3 className="font-semibold mb-2">Fournisseurs</h3>
          <table className="min-w-full text-sm mb-4">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Nb achats</th>
                <th>Prix moyen (€)</th>
                <th>Dernier prix (€)</th>
                <th>Dernière date</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center">
                    Aucun historique
                  </td>
                </tr>
              ) : (
                summary.map((s, i) => (
                  <tr key={i}>
                    <td>{s.nom}</td>
                    <td>{s.count}</td>
                    <td>{s.prix_moyen ? s.prix_moyen.toFixed(2) : "-"}</td>
                    <td>{s.lastPrice != null ? s.lastPrice.toFixed(2) : "-"}</td>
                    <td>{s.lastDate ? s.lastDate.slice(0, 10) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <h3 className="font-semibold mb-2">Historique des prix d’achat</h3>
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
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                historique.map((h, i) => (
                  <tr key={i}>
                    <td>{h.created_at?.slice(0, 10) || "-"}</td>
                    <td>{h.fournisseur?.nom || "-"}</td>
                    <td>{h.prix_achat ?? "-"}</td>
                    <td>{h.derniere_livraison?.slice(0, 10) || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {chartData.length > 0 && (
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(chartData[0])
                    .filter((k) => k !== "date")
                    .map((key) => (
                      <Line key={key} type="monotone" dataKey={key} stroke="#bfa14d" />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <h3 className="font-semibold mt-6 mb-2">Historique des mouvements</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Source</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    Aucun mouvement
                  </td>
                </tr>
              ) : (
                mouvements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.date?.slice(0, 10) || "-"}</td>
                    <td>{m.type}</td>
                    <td>{m.quantite}</td>
                    <td>{m.zone_source?.nom || "-"}</td>
                    <td>{m.zone_destination?.nom || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={exportExcel} className="btn btn-secondary">
          Export Excel
        </button>
        <button onClick={onClose} className="btn">
          Fermer
        </button>
      </div>
    </ModalGlass>
  );
}
