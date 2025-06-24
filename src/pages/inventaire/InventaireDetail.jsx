import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInventaires } from "@/hooks/useInventaires";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
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

  if (!inventaire) return <div className="p-6">Chargement...</div>;

  const exportCSV = () => {
    const rows = (inventaire.lignes || []).map(l => ({
      Produit: l.produit_nom || l.nom,
      Unite: l.unite,
      Physique: l.quantite_physique,
      Theorique: l.quantite_theorique,
      Prix: l.prix_unitaire,
      Valeur: l.quantite_physique * l.prix_unitaire,
      Ecart: l.quantite_physique - l.quantite_theorique,
      ValeurEcart: (l.quantite_physique - l.quantite_theorique) * l.prix_unitaire,
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
        l.produit_nom || l.nom,
        l.unite,
        l.quantite_physique,
        l.quantite_theorique,
        l.prix_unitaire,
        (l.quantite_physique * l.prix_unitaire).toFixed(2),
        (l.quantite_physique - l.quantite_theorique).toFixed(2),
        ((l.quantite_physique - l.quantite_theorique) * l.prix_unitaire).toFixed(2),
      ]),
      styles: { fontSize: 9 },
    });
    doc.save(`inventaire_${id}.pdf`);
  };

  const totalValeur = (inventaire.lignes || []).reduce(
    (s, l) => s + Number(l.quantite_physique || 0) * Number(l.prix_unitaire || 0),
    0
  );
  const totalEcart = (inventaire.lignes || []).reduce(
    (s, l) =>
      s + (Number(l.quantite_physique || 0) - Number(l.quantite_theorique || 0)) * Number(l.prix_unitaire || 0),
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
              const valeur = Number(l.quantite_physique || 0) * Number(l.prix_unitaire || 0);
              const ecart = Number(l.quantite_physique || 0) - Number(l.quantite_theorique || 0);
              return (
                <tr key={idx} className="border-b last:border-none">
                  <td className="p-2">{l.produit_nom || l.nom}</td>
                  <td className="p-2">{l.unite}</td>
                  <td className="p-2">{l.quantite_physique}</td>
                  <td className="p-2">{l.quantite_theorique}</td>
                  <td className="p-2">{l.prix_unitaire}</td>
                  <td className="p-2">{valeur.toFixed(2)}</td>
                  <td className={`p-2 ${ecart < 0 ? 'text-red-600' : ecart > 0 ? 'text-green-600' : ''}`}>{ecart.toFixed(2)}</td>
                  <td className={`p-2 ${(ecart * l.prix_unitaire) < 0 ? 'text-red-600' : (ecart * l.prix_unitaire) > 0 ? 'text-green-600' : ''}`}>{(ecart * l.prix_unitaire).toFixed(2)}</td>
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
