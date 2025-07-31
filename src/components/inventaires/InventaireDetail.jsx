// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useInventaires } from "@/hooks/useInventaires";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function InventaireDetail({ inventaire, onClose }) {
  const { fetchMouvementsInventaire } = useInventaires();
  const [mouvements, setMouvements] = useState([]);

  useEffect(() => {
    if (inventaire?.id) fetchMouvementsInventaire(inventaire.id).then(setMouvements);
  }, [inventaire?.id]);

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(inventaire.lignes || []);
    XLSX.utils.book_append_sheet(wb, ws, "LignesInventaire");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mouvements), "Mouvements");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `inventaire_${inventaire.id}.xlsx`);
  };

  // Export PDF (à brancher jsPDF)
  const exportPDF = () => {
    toast.success("Export PDF non implémenté (brancher jsPDF)");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{inventaire.reference}</h2>
        <div><b>Date :</b> {inventaire.date_inventaire}</div>
        <div><b>Clôture :</b> {inventaire.cloture ? "Oui" : "Non"}</div>
        <div>
          <b>Document :</b> {inventaire.document ?
            <a href={inventaire.document} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir document</a> :
            <span className="text-gray-400">Aucun</span>
          }
        </div>
        <div className="my-4">
          <h3 className="font-bold mb-2">Lignes d’inventaire</h3>
          <table className="min-w-full bg-white/10 border border-white/20 rounded backdrop-blur-xl">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantité inventoriée</th>
                <th>Unité</th>
                <th>Stock théorique</th>
                <th>PMP</th>
                <th>Écart</th>
              </tr>
            </thead>
            <tbody>
              {inventaire.lignes?.length > 0 ? inventaire.lignes.map((l, i) => (
                <tr key={i}>
                  <td>{l.nom}</td>
                  <td>{l.quantite}</td>
                  <td>{l.unite}</td>
                  <td>{l.stock_theorique}</td>
                  <td>{l.pmp}</td>
                  <td>{(l.quantite - l.stock_theorique)?.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-gray-400">Aucune ligne</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="my-4">
          <h3 className="font-bold mb-2">Mouvements liés</h3>
          <table className="min-w-full bg-white/10 border border-white/20 rounded backdrop-blur-xl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Stock après</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length > 0 ? mouvements.map((m, i) => (
                <tr key={i}>
                  <td>{m.date}</td>
                  <td>{m.nom}</td>
                  <td>{m.type}</td>
                  <td>{m.quantite}</td>
                  <td>{m.stock_apres}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-gray-400">Aucun mouvement</td></tr>
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
