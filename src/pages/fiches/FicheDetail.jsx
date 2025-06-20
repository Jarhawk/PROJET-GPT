import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function FicheDetail({ fiche: ficheProp, onClose }) {
  const { id } = useParams();
  const { mama_id } = useAuth();
  const [fiche, setFiche] = useState(ficheProp);

  useEffect(() => {
    const fid = ficheProp?.id || id;
    if (fid && mama_id && !ficheProp) {
      supabase
        .from("fiches")
        .select("*")
        .eq("id", fid)
        .eq("mama_id", mama_id)
        .single()
        .then(({ data }) => setFiche(data));
    }
  }, [ficheProp, id, mama_id]);

  if (!fiche) return <div className="p-8">Chargement...</div>;
  // Export Excel fiche
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([fiche]);
    XLSX.utils.book_append_sheet(wb, ws, "Fiche");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `fiche_${fiche.id}.xlsx`);
  };

  // Export PDF de la fiche technique
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Fiche: ${fiche.nom}`, 10, 12);
    doc.text(`Portions: ${fiche.portions}`, 10, 20);
    doc.text(`Coût total: ${fiche.cout_total?.toFixed(2)} €`, 10, 28);
    doc.text(`Coût/portion: ${fiche.cout_par_portion?.toFixed(2)} €`, 10, 36);
    doc.autoTable({
      startY: 44,
      head: [["Ingrédient", "Qté", "Unité", "Coût €"]],
      body: fiche.lignes?.map(l => [l.nom, l.quantite, l.unite, (l.pmp * l.quantite).toFixed(2)]) || [],
      styles: { fontSize: 9 },
    });
    doc.save(`fiche_${fiche.id}.pdf`);
  };

  // Historique des modifs (à brancher si besoin)
  const historique = fiche.historique || [
    { date: "2024-06-01", user: "admin", action: "Création" },
    { date: "2024-06-02", user: "chef", action: "Maj portions" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative text-shadow">
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
          <b>Historique :</b>
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
