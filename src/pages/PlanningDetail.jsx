// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlanning } from "@/hooks/usePlanning";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function PlanningDetail() {
  const { id } = useParams();
  const { getPlanningById } = usePlanning();
  const [planning, setPlanning] = useState(null);

  useEffect(() => {
    if (id) getPlanningById(id).then(setPlanning);
  }, [id, getPlanningById]);

  if (!planning) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 space-y-4">
      <Link to="/planning"><Button variant="outline">Retour</Button></Link>
      <h1 className="text-2xl font-bold">{planning.nom}</h1>
      <div>Date : {planning.date_prevue}</div>
      <div>Statut : {planning.statut}</div>
      <div>Commentaire : {planning.commentaire || "-"}</div>
      {planning.lignes?.length > 0 && (
        <TableContainer>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Produit</th>
                <th className="px-2 py-1 text-left">Quantité</th>
                <th className="px-2 py-1 text-left">Observation</th>
              </tr>
            </thead>
            <tbody>
              {planning.lignes.map(l => (
                <tr key={l.id}>
                  <td className="px-2 py-1">{l.produit?.nom}</td>
                  <td className="px-2 py-1">{l.quantite}</td>
                  <td className="px-2 py-1">{l.observation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
