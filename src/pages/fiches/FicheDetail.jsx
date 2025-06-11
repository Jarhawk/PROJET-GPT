import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function FicheDetail({ fiche, onClose }) {
  // Export Excel fiche
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([fiche]);
    XLSX.utils.book_append_sheet(wb, ws, "Fiche");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `fiche_${fiche.id}.xlsx`);
  };

  // Export PDF (à brancher jsPDF)
  const exportPDF = () => {
    toast.success("PDF export non implémenté (brancher jsPDF)");
  };

  // Historique des modifs (à brancher si besoin)
  const historique = fiche.historique || [
    { date: "2024-06-01", user: "admin", action: "Création" },
    { date: "2024-06-02", user: "chef", action: "Maj portions" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{fiche.nom}</h2>
        <div><b>Portions :</b> {fiche.portions}</div>
        <div><b>Coût total :</b> {fiche.cout_total?.toFixed(2)} €</div>
        <div><b>Coût/portion :</b> {fiche.cout_par_portion?.toFixed(2)} €</div>
        <div><b>Description :</b> {fiche.description}</div>
        <div className="my-2">
          <b>Ingrédients :</b>
          <ul className="list-disc pl-6">
            {fiche.lignes?.map((l, i) =>
              <li key={i}>
                {l.nom} — {l.quantite} {l.unite} — {(l.pmp * l.quantite).toFixed(2)} €
              </li>
            )}
          </ul>
        </div>
        <div>
          <b>Image :</b> {fiche.image ?
            <img src={fiche.image} alt="Fiche" className="max-h-32" /> :
            <span className="text-gray-400">Aucune</span>
          }
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
        <div className="mt-4">
          <b>Historique :</b>
          <ul className="list-disc pl-6">
            {historique.map((h, i) =>
              <li key={i}>{h.date} — {h.user} — {h.action}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
