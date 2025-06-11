import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function FactureDetail({ facture, onClose }) {
  // TODO: remplacer par chargement des mouvements/fichiers liés à la facture si besoin

  // Export Excel d'une seule facture
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([facture]);
    XLSX.utils.book_append_sheet(wb, ws, "Facture");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `facture_${facture.id}.xlsx`);
  };

  // Export PDF (à brancher jsPDF)
  const exportPDF = () => {
    toast.success("PDF export non implémenté (brancher jsPDF)");
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
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>
    </div>
  );
}
