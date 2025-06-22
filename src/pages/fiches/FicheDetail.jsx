import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useFiches } from "@/hooks/useFiches";

export default function FicheDetail({ fiche: ficheProp, onClose }) {
  const { id: routeId } = useParams();
  const { getFicheById } = useFiches();
  const [fiche, setFiche] = useState(ficheProp || null);

  useEffect(() => {
    const fid = ficheProp?.id || routeId;
    if (fid && !ficheProp) {
      getFicheById(fid).then(setFiche);
    }
  }, [ficheProp, routeId, getFicheById]);

  if (!fiche) return <div className="p-8">Chargement...</div>;

  function exportExcel() {
    const rows = fiche.lignes?.map(l => ({
      Produit: l.product?.nom,
      Quantite: l.quantite,
      Unite: l.product?.unite,
      Cout: l.product?.pmp ? (l.product.pmp * l.quantite).toFixed(2) : "",
    })) || [];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Fiche");
    XLSX.writeFile(wb, `fiche_${fiche.id}.xlsx`);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative text-shadow">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{fiche.nom}</h2>
        <div><b>Portions :</b> {fiche.portions}</div>
        <div><b>Coût total :</b> {Number(fiche.cout_total).toFixed(2)} €</div>
        <div><b>Coût/portion :</b> {Number(fiche.cout_par_portion).toFixed(2)} €</div>
        <div className="my-2">
          <b>Ingrédients :</b>
          <ul className="list-disc pl-6">
            {fiche.lignes?.map((l, i) => (
              <li key={i}>
                {l.product?.nom} — {l.quantite} {l.product?.unite} — {l.product?.pmp ? (l.product.pmp * l.quantite).toFixed(2) : "-"} €
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
        </div>
      </div>
    </div>
  );
}
