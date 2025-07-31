// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";
import { useInvoiceItems } from "@/hooks/useInvoiceItems";
import { useFactures } from "@/hooks/useFactures";

export default function FactureDetail({ facture: factureProp, onClose }) {
  const { id } = useParams();
  const { fetchFactureById, createFacture, addLigneFacture, calculateTotals, toggleFactureActive } = useFactures();
  const { items: produitsFacture, fetchItemsByInvoice } = useInvoiceItems();
  const [facture, setFacture] = useState(factureProp);

  useEffect(() => {
    const fid = factureProp?.id || id;
    if (fid) {
      if (!factureProp) fetchFactureById(fid).then(setFacture);
      fetchItemsByInvoice(fid);
    }
  }, [factureProp, id]);

  if (!facture) return <LoadingSpinner message="Chargement..." />;

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
    doc.text(`Fournisseur: ${facture.fournisseur?.nom}`, 10, 20);
    doc.text(`Date: ${facture.date_facture}`, 10, 28);
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

  const duplicate = async () => {
    const { id: _id, ...payload } = facture;
    const { data } = await createFacture({ ...payload, numero: `${facture.numero || facture.id}-copie` });
    if (data) {
      for (const l of produitsFacture) {
        await addLigneFacture(data.id, { produit_id: l.produit_id, quantite: l.quantite, prix: l.prix_unitaire, tva: l.tva, fournisseur_id: facture.fournisseur_id });
      }
      await calculateTotals(data.id);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">Détail de la facture #{facture.id}</h2>
        <div><b>Date :</b> {facture.date_facture}</div>
        <div><b>Fournisseur :</b> {facture.fournisseur?.nom}</div>
        <div><b>Montant :</b> {facture.total_ttc?.toFixed(2)} €</div>
        <div><b>Statut :</b> {facture.statut}</div>
        <div>
          <b>Actif :</b> {facture.actif ? "Oui" : "Non"}
          <Button
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={async () => {
              await toggleFactureActive(facture.id, !facture.actif);
              const f = await fetchFactureById(facture.id);
              setFacture(f);
            }}
          >
            {facture.actif ? "Désactiver" : "Réactiver"}
          </Button>
        </div>
        <div>
          <b>Justificatif :</b> {facture.justificatif ?
            <a href={facture.justificatif} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir PDF</a> :
            <span className="text-gray-400">Aucun</span>
          }
        </div>
        {produitsFacture.length > 0 && (
          <TableContainer className="mt-4">
            <table className="min-w-full text-sm">
            <thead className="bg-white/10 border-b border-white/20">
              <tr>
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
          </TableContainer>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
          <Button variant="outline" onClick={duplicate}>Dupliquer</Button>
        </div>
      </div>
    </div>
  );
}
