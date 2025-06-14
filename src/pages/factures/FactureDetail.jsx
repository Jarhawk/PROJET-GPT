import { useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { useFactureProduits } from "@/hooks/useFactureProduits";

export default function FactureDetail({ facture, onClose }) {
  const { produitsFacture, fetchProduitsByFacture } = useFactureProduits();

  useEffect(() => {
    if (facture?.id) fetchProduitsByFacture(facture.id);
  }, [facture?.id]);

  // Export Excel d'une seule facture
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([facture]);
    XLSX.utils.book_append_sheet(wb, ws, "Facture");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `facture_${facture.id}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Facture #${facture.id}`, 10, 12);
    doc.text(`Fournisseur: ${facture.fournisseur_nom}`, 10, 20);
    doc.text(`Date: ${facture.date}`, 10, 28);
    doc.autoTable({
      startY: 36,
      head: [["Produit", "Quantité", "PU", "Total"]],
      body: produitsFacture.map(l => [
        l.produit?.nom || "-",
        l.quantite,
        l.prix_unitaire,
        l.total,
      ]),
      styles: { fontSize: 9 },
    });
    doc.save(`facture_${facture.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">Détail de la facture #{facture.id}</h2>
        <div><b>Date :</b> {facture.date}</div>
        <div><b>Fournisseur :</b> {facture.fournisseur_nom}</div>
        <div><b>Montant :</b> {facture.montant?.toFixed(2)} €</div>
        <div><b>Statut :</b> {facture.statut}</div>
        <div>
          <b>Justificatif :</b> {facture.justificatif ?
            <a href={facture.justificatif} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir PDF</a> :
            <span className="text-gray-400">Aucun</span>
          }
        </div>
        {produitsFacture.length > 0 && (
          <table className="mt-4 text-sm w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">Produit</th>
                <th className="px-2 py-1 border">Quantité</th>
                <th className="px-2 py-1 border">PU</th>
                <th className="px-2 py-1 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {produitsFacture.map(l => (
                <tr key={l.id}>
                  <td className="border px-2 py-1">{l.produit?.nom || '-'}</td>
                  <td className="border px-2 py-1 text-right">{l.quantite}</td>
                  <td className="border px-2 py-1 text-right">{l.prix_unitaire}</td>
                  <td className="border px-2 py-1 text-right">{l.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>
    </div>
  );
}
