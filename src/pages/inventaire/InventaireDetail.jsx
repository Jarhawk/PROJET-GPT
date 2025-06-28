import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInventaires } from "@/hooks/useInventaires";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function InventaireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInventaireById } = useInventaires();
  const [inventaire, setInventaire] = useState(null);

  useEffect(() => {
    if (id) getInventaireById(id).then(setInventaire);
  }, [id]);

  if (!inventaire) return <LoadingSpinner message="Chargement..." />;

  const exportCSV = () => {
    const rows = (inventaire.lignes || []).map(l => ({
      Produit: l.product?.nom,
      Unite: l.product?.unite,
      Physique: l.quantite,
      Theorique: l.product?.stock_theorique,
      Prix: l.product?.pmp,
      Valeur: l.quantite * (l.product?.pmp || 0),
      Ecart: l.quantite - (l.product?.stock_theorique || 0),
      ValeurEcart: (l.quantite - (l.product?.stock_theorique || 0)) * (l.product?.pmp || 0),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "inventaire");
    XLSX.writeFile(wb, `inventaire_${id}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Inventaire ${inventaire.date}`, 10, 10);
    doc.autoTable({
      startY: 20,
      head: [["Produit", "Unité", "Physique", "Théorique", "Prix", "Valeur", "Écart", "Valeur écart"]],
      body: (inventaire.lignes || []).map(l => [
        l.product?.nom,
        l.product?.unite,
        l.quantite,
        l.product?.stock_theorique,
        l.product?.pmp,
        (l.quantite * (l.product?.pmp || 0)).toFixed(2),
        (l.quantite - (l.product?.stock_theorique || 0)).toFixed(2),
        ((l.quantite - (l.product?.stock_theorique || 0)) * (l.product?.pmp || 0)).toFixed(2),
      ]),
      styles: { fontSize: 9 },
    });
    doc.save(`inventaire_${id}.pdf`);
  };

  const totalValeur = (inventaire.lignes || []).reduce(
    (s, l) => s + Number(l.quantite || 0) * Number(l.product?.pmp || 0),
    0
  );
  const totalEcart = (inventaire.lignes || []).reduce(
    (s, l) =>
      s + (Number(l.quantite || 0) - Number(l.product?.stock_theorique || 0)) * Number(l.product?.pmp || 0),
    0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
      <h1 className="text-xl font-bold">Inventaire du {inventaire.date}</h1>
      <div>Zone : {inventaire.zone || '-'}</div>

      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Produit</th>
              <th className="p-2">Unité</th>
              <th className="p-2">Physique</th>
              <th className="p-2">Théorique</th>
              <th className="p-2">Prix</th>
              <th className="p-2">Valeur</th>
              <th className="p-2">Écart</th>
              <th className="p-2">Valeur écart</th>
            </tr>
          </thead>
          <tbody>
            {(inventaire.lignes || []).map((l, idx) => {
              const valeur = Number(l.quantite || 0) * Number(l.product?.pmp || 0);
              const ecart = Number(l.quantite || 0) - Number(l.product?.stock_theorique || 0);
              return (
                <tr key={idx} className="border-b last:border-none">
                  <td className="p-2">{l.product?.nom}</td>
                  <td className="p-2">{l.product?.unite}</td>
                  <td className="p-2">{l.quantite}</td>
                  <td className="p-2">{l.product?.stock_theorique}</td>
                  <td className="p-2">{l.product?.pmp}</td>
                  <td className="p-2">{valeur.toFixed(2)}</td>
                  <td className={`p-2 ${ecart < 0 ? 'text-red-600' : ecart > 0 ? 'text-green-600' : ''}`}>{ecart.toFixed(2)}</td>
                  <td className={`p-2 ${(ecart * (l.product?.pmp || 0)) < 0 ? 'text-red-600' : (ecart * (l.product?.pmp || 0)) > 0 ? 'text-green-600' : ''}`}>{(ecart * (l.product?.pmp || 0)).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>

      <div className="font-semibold text-right">
        Valeur totale : {totalValeur.toFixed(2)} € – Écart global : {totalEcart.toFixed(2)} €
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
        <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
      </div>
    </div>
  );
}
