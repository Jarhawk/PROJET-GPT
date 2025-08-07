// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInventaires } from "@/hooks/useInventaires";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import useAuth from "@/hooks/useAuth";

export default function InventaireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInventaireById } = useInventaires();
  const [inventaire, setInventaire] = useState(null);
  const { mama_id, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && mama_id && id) {
      getInventaireById(id).then(setInventaire);
    }
  }, [id, mama_id, authLoading, getInventaireById]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  if (!inventaire) return <LoadingSpinner message="Chargement..." />;

  const exportExcel = () => {
    const rows = (inventaire.lignes || []).map(l => {
      const ecart = l.quantite_reelle - (l.product?.stock_theorique || 0);
      const valeurEcart = ecart * (l.product?.pmp || 0);
      const conso = l.conso_calculee || 0;
      const requisition = l.requisition_mensuelle || 0;
      const ecartReq = l.ecart_requisition || requisition - conso;
      return {
        Date: inventaire.date_inventaire,
        Zone: inventaire.zone || "",
        Produit: l.product?.nom,
        Famille: l.product?.famille,
        Quantite: l.quantite_reelle,
        StockTheorique: l.product?.stock_theorique,
        PMP: l.product?.pmp,
        Ecart: ecart,
        ValeurEcart: valeurEcart,
        Conso: conso,
        Requisition: requisition,
        EcartRequisition: ecartReq,
        Mois_1: l.mois_m1,
        Mois_2: l.mois_m2,
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Inventaire");
    XLSX.writeFile(wb, `inventaire_${id}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(
      `Inventaire ${inventaire.date_inventaire} – Zone ${inventaire.zone || ''}`,
      10,
      10
    );
    doc.autoTable({
      startY: 20,
      head: [["Produit", "Unité", "Physique", "Théorique", "Prix", "Valeur", "Écart", "Valeur écart"]],
      body: (inventaire.lignes || []).map(l => [
        l.product?.nom,
        l.product?.unite?.nom,
        l.quantite_reelle,
        l.product?.stock_theorique,
        l.product?.pmp,
        (l.quantite_reelle * (l.product?.pmp || 0)).toFixed(2),
        (l.quantite_reelle - (l.product?.stock_theorique || 0)).toFixed(2),
        ((l.quantite_reelle - (l.product?.stock_theorique || 0)) * (l.product?.pmp || 0)).toFixed(2),
      ]),
      styles: { fontSize: 9 },
    });
    doc.save(`inventaire_${id}.pdf`);
  };

  const totalValeur = (inventaire.lignes || []).reduce(
    (s, l) => s + Number(l.quantite_reelle || 0) * Number(l.product?.pmp || 0),
    0
  );
  const totalEcart = (inventaire.lignes || []).reduce(
    (s, l) =>
      s + (Number(l.quantite_reelle || 0) - Number(l.product?.stock_theorique || 0)) * Number(l.product?.pmp || 0),
    0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
      <h1 className="text-xl font-bold">Inventaire du {inventaire.date_inventaire}</h1>
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
              const valeur = Number(l.quantite_reelle || 0) * Number(l.product?.pmp || 0);
              const ecart = Number(l.quantite_reelle || 0) - Number(l.product?.stock_theorique || 0);
              return (
                <tr key={idx} className="border-b last:border-none">
                  <td className="p-2">{l.product?.nom}</td>
                  <td className="p-2">{l.product?.unite?.nom}</td>
                  <td className="p-2">{l.quantite_reelle}</td>
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
        <Button variant="outline" onClick={exportExcel}>Exporter Excel</Button>
        <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
      </div>
    </div>
  );
}
