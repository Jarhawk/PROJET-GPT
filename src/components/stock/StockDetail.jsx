// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

// eslint-disable-next-line react-refresh/only-export-components
export function buildRotationData(mouvements) {
  const map = {};
  mouvements.forEach(m => {
    if (m.type !== 'sortie' || !m.date) return;
    const mois = m.date.slice(0, 7);
    map[mois] = (map[mois] || 0) + Number(m.quantite || 0);
  });
  return Object.entries(map).map(([mois, q]) => ({ mois, q }));
}

export default function StockDetail({ produit, mouvements, onClose }) {
  const rotationData = buildRotationData(mouvements);
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mouvements);
    XLSX.utils.book_append_sheet(wb, ws, "MouvementsStock");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `stock_${produit.id}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{produit.nom} — Mouvements</h2>
        <div className="mb-2">Stock réel : {produit.stock_reel} {produit.unite}</div>
        <div className="mb-2">Valorisation : {(produit.pmp * produit.stock_reel).toFixed(2)} €</div>
        <div>
          <table className="min-w-full bg-white/10 border border-white/20 rounded backdrop-blur-xl text-xs">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Commentaire</th>
                <th>Zone source</th>
                <th>Zone destination</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length > 0 ? mouvements.map((m, i) => (
                <tr key={i}>
                  <td>{m.date?.slice(0, 10)}</td>
                  <td>{m.type}</td>
                  <td>{m.quantite}</td>
                  <td>{m.commentaire}</td>
                  <td>{m.zone_source?.nom || m.zone_source_id || '-'}</td>
                  <td>{m.zone_destination?.nom || m.zone_destination_id || '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-gray-400">Aucun mouvement</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {rotationData.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-1">Rotation mensuelle</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={rotationData}>
                <XAxis dataKey="mois" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="q" name="Sorties" stroke="#bfa14d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
        </div>
      </div>
    </div>
  );
}
