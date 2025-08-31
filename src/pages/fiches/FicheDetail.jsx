// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import JSPDF from "jspdf";
import "jspdf-autotable";
import { useFiches } from "@/hooks/useFiches";
import { useFicheCoutHistory } from "@/hooks/useFicheCoutHistory";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function FicheDetail({ fiche: ficheProp, onClose }) {
  const { id: routeId } = useParams();
  const { getFicheById } = useFiches();
  const { access_rights, loading: authLoading } = useAuth();
  const [fiche, setFiche] = useState(ficheProp || null);
  const { history, fetchFicheCoutHistory } = useFicheCoutHistory();
  const [simPrix, setSimPrix] = useState(null);

  useEffect(() => {
    const fid = ficheProp?.id || routeId;
    if (fid) {
      getFicheById(fid).then(setFiche);
    }
  }, [ficheProp?.id, routeId, getFicheById]);

  useEffect(() => {
    if (fiche?.id) {
      fetchFicheCoutHistory(fiche.id);
      setSimPrix(fiche.prix_vente || 0);
    }
  }, [fiche?.id, fetchFicheCoutHistory, fiche?.prix_vente]);

  if (authLoading || !fiche) return <LoadingSpinner message="Chargement..." />;

  if (!access_rights?.fiches_techniques?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  function exportExcel() {
    const lignes = Array.isArray(fiche?.lignes) ? fiche.lignes : [];
    const rows = [];
    for (const l of lignes) {
      rows.push({
        Produit: l.produit_nom || l.sous_fiche?.nom,
        Quantite: l.quantite,
        Unite: l.unite_nom || (l.sous_fiche ? "portion" : ""),
        Cout: l.produit_id
          ? ((Number(l.pmp ?? l.dernier_prix ?? 0) * l.quantite).toFixed(2))
          : l.sous_fiche?.cout_par_portion
            ? (l.sous_fiche.cout_par_portion * l.quantite).toFixed(2)
            : "",
      });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Fiche");
    XLSX.writeFile(wb, `fiche_${fiche.id}.xlsx`);
  }

  function exportPDF() {
    const doc = new JSPDF();
    doc.text(fiche.nom, 10, 10);
    const lignes = Array.isArray(fiche?.lignes) ? fiche.lignes : [];
    const rows = [];
    for (const l of lignes) {
      rows.push([
        l.produit_nom || l.sous_fiche?.nom,
        l.quantite,
        l.unite_nom || (l.sous_fiche ? "portion" : ""),
        l.produit_id
          ? ((Number(l.pmp ?? l.dernier_prix ?? 0) * l.quantite).toFixed(2))
          : l.sous_fiche?.cout_par_portion
            ? (l.sous_fiche.cout_par_portion * l.quantite).toFixed(2)
            : "",
      ]);
    }
    doc.autoTable({
      head: [["Produit", "Quantité", "Unité", "Coût"]],
      body: rows,
      startY: 20,
    });
    const y = doc.lastAutoTable.finalY || 20;
    doc.text(`Portions : ${fiche.portions}`, 10, y + 10);
    doc.text(`Coût total : ${Number(fiche.cout_total).toFixed(2)} €`, 10, y + 20);
    doc.text(`Coût/portion : ${Number(fiche.cout_par_portion).toFixed(2)} €`, 10, y + 30);
    doc.save(`fiche_${fiche.id}.pdf`);
  }

  const chartData = [];
  const histArr = Array.isArray(history) ? history : [];
  for (const h of histArr) {
    chartData.push({
      date: new Date(h.date).toLocaleDateString('fr-FR'),
      marge:
        h.prix_vente && h.cout_portion
          ? ((h.prix_vente - h.cout_portion) / h.prix_vente) * 100
          : null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg text-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative text-shadow">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{fiche.nom}</h2>
        {fiche.famille && (
          <div><b>Famille :</b> {fiche.famille}</div>
        )}
        {typeof fiche.rendement === 'number' && (
          <div><b>Rendement :</b> {fiche.rendement}</div>
        )}
        <div><b>Portions :</b> {fiche.portions}</div>
        <div><b>Coût total :</b> {Number(fiche.cout_total).toFixed(2)} €</div>
        <div><b>Coût/portion :</b> {Number(fiche.cout_par_portion).toFixed(2)} €</div>
        {fiche.prix_vente && (
          <div><b>Ratio :</b> {((Number(fiche.cout_par_portion) / Number(fiche.prix_vente)) * 100).toFixed(1)}%</div>
        )}
        <div className="my-2">
          <b>Ingrédients :</b>
            <ul className="list-disc pl-6">
              {(() => {
                const items = [];
                const arr = Array.isArray(fiche?.lignes) ? fiche.lignes : [];
                for (let i = 0; i < arr.length; i++) {
                  const l = arr[i];
                  items.push(
                    <li key={i}>
                      {l.produit_nom || l.sous_fiche?.nom} — {l.quantite}{" "}
                      {l.unite_nom || (l.sous_fiche ? "portion" : "")} —{" "}
                      {l.produit_id
                        ? (Number(l.pmp ?? l.dernier_prix ?? 0) * l.quantite).toFixed(2)
                        : l.sous_fiche?.cout_par_portion
                          ? (l.sous_fiche.cout_par_portion * l.quantite).toFixed(2)
                          : "-"}
                      {" €"}
                    </li>
                  );
                }
                return items;
              })()}
            </ul>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Analyse rentabilité</h3>
            <div className="h-32 bg-white/10 border border-white/20 backdrop-blur-xl rounded mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 'dataMax']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="marge" stroke="#8884d8" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          <div className="flex items-center gap-2">
            <input type="number" className="input w-24" value={simPrix ?? ''} onChange={e => setSimPrix(Number(e.target.value))} />
            {simPrix !== null && (
              <span>Si je vends à {simPrix.toFixed(2)} € : marge {(simPrix > 0 ? ((simPrix - Number(fiche.cout_par_portion)) / simPrix) * 100 : 0).toFixed(1)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
