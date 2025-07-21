// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAchats } from "@/hooks/useAchats";

export default function AchatDetail({ achat: achatProp, onClose }) {
  const { fetchAchatById } = useAchats();
  const [achat, setAchat] = useState(achatProp);

  useEffect(() => {
    if (!achatProp?.id) return;
    if (!achatProp) fetchAchatById(achatProp.id).then(setAchat);
  }, [achatProp]);

  if (!achat) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <GlassCard className="p-6 min-w-[300px] space-y-2">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="text-lg font-bold mb-2">Achat du {achat.date_achat}</h2>
        <div><b>Produit :</b> {achat.produit?.nom}</div>
        <div><b>Fournisseur :</b> {achat.fournisseur?.nom}</div>
        <div><b>Quantité :</b> {achat.quantite}</div>
        <div><b>Prix :</b> {Number(achat.prix || 0).toFixed(2)} €</div>
      </GlassCard>
    </div>
  );
}
