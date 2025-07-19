// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useValidations } from "@/hooks/useValidations";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";

export default function ValidationDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { fetchRequestById, updateStatus } = useValidations();
  const [request, setRequest] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchRequestById(id).then(setRequest);
  }, [id, fetchRequestById]);

  const handle = async (status) => {
    setSaving(true);
    await updateStatus(id, status);
    const r = await fetchRequestById(id);
    setRequest(r);
    setSaving(false);
    if (r) toast.success("Statut mis à jour");
  };

  if (!request) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-8 container mx-auto text-sm">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Détail validation</h1>
      <GlassCard className="p-4 space-y-2">
        <div><b>Action :</b> {request.action_type}</div>
        <div><b>Table :</b> {request.table_cible}</div>
        <div><b>Element :</b> {request.element_id}</div>
        <div><b>Statut :</b> {request.statut}</div>
        <div><b>Commentaire :</b> {request.commentaire || '-'}</div>
        <div><b>Date demande :</b> {request.date_demande?.slice(0,10)}</div>
        <div><b>Date validation :</b> {request.date_validation?.slice(0,10) || '-'}</div>
      </GlassCard>
      {isAdmin && request.statut === 'pending' && (
        <div className="mt-4 space-x-2">
          <Button disabled={saving} onClick={() => handle('approved')}>Approuver</Button>
          <Button variant="destructive" disabled={saving} onClick={() => handle('rejected')}>Rejeter</Button>
        </div>
      )}
    </div>
  );
}
