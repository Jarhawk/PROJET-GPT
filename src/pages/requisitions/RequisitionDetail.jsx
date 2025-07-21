// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useParams } from "react-router-dom";
import { useRequisitions } from "@/hooks/useRequisitions";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

function RequisitionDetailPage() {
  const { id } = useParams();
  const { getRequisitionById } = useRequisitions();
  const { loading: authLoading } = useAuth();
  const [requisition, setRequisition] = useState(null);

  useEffect(() => {
    if (id && !authLoading) {
      getRequisitionById(id).then(setRequisition);
    }
  }, [id, getRequisitionById, authLoading]);

  if (!requisition) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-mamastock-gold mb-6">Détail de la réquisition</h1>
      <GlassCard className="p-4 space-y-2">
        <div>
          <strong>Statut :</strong> {requisition.statut}
        </div>
        <div>
          <strong>Date :</strong> {requisition.date_demande}
        </div>
        <div>
          <strong>Zone :</strong> {requisition.zone_id}
        </div>
        <div>
          <strong>Commentaire :</strong> {requisition.commentaire}
        </div>
        <div>
          <strong>Lignes :</strong>
          <ul className="list-disc ml-5">
            {(requisition.lignes || []).map((l) => (
              <li key={l.id}>
                {l.produit_id} - {l.quantite_demandee} (stock {l.stock_theorique_avant} → {l.stock_theorique_apres})
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>
    </div>
  );
}

export default function RequisitionDetail() {
  return (
    <RequisitionDetailPage />
  );
}
