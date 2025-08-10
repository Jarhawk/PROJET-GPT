// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useBonsLivraison } from "@/hooks/useBonsLivraison";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from '@/hooks/useAuth';

export default function BLDetail({ bon: bonProp, onClose }) {
  const { id } = useParams();
  const { fetchBonLivraisonById, toggleBonActif } = useBonsLivraison();
  const [bon, setBon] = useState(bonProp);
  const { mama_id, loading: authLoading } = useAuth();

  useEffect(() => {
    const bid = bonProp?.id || id;
    if (!authLoading && mama_id && bid && !bonProp) {
      fetchBonLivraisonById(bid).then(setBon);
    }
  }, [bonProp, id, mama_id, authLoading, fetchBonLivraisonById]);

  if (authLoading || !bon) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">Bon de livraison #{bon.numero_bl}</h2>
        <div><b>Date :</b> {bon.date_reception}</div>
        <div><b>Fournisseur :</b> {bon.fournisseur?.nom}</div>
        <div><b>Commentaire :</b> {bon.commentaire || "-"}</div>
        <div>
          <b>Actif :</b> {bon.actif ? "Oui" : "Non"}
          <Button size="sm" variant="outline" className="ml-2" onClick={async () => {
            await toggleBonActif(bon.id, !bon.actif);
            const b = await fetchBonLivraisonById(bon.id);
            setBon(b);
          }}>{bon.actif ? "Désactiver" : "Réactiver"}</Button>
        </div>
        {bon.lignes?.length > 0 && (
          <TableContainer className="mt-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Produit</th>
                  <th className="border px-2 py-1">Qté</th>
                  <th className="border px-2 py-1">PU</th>
                  <th className="border px-2 py-1">TVA</th>
                </tr>
              </thead>
              <tbody>
                {bon.lignes.map(l => (
                  <tr key={l.id}>
                    <td className="border px-2 py-1">{l.produit?.nom}</td>
                    <td className="border px-2 py-1 text-right">{l.quantite_recue}</td>
                    <td className="border px-2 py-1 text-right">{l.prix_unitaire}</td>
                    <td className="border px-2 py-1 text-right">{l.tva}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}
