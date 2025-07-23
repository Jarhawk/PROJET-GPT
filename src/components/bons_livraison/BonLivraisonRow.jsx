import { Button } from "@/components/ui/button";

export default function BonLivraisonRow({ bon, onEdit, onDetail, onToggleActive, canEdit }) {
  const montant = (bon.lignes || []).reduce((s, l) => s + (l.quantite_recue || 0) * (l.prix_unitaire || 0) * (1 + (l.tva || 0) / 100), 0);
  const lignesCount = (bon.lignes || []).length;
  return (
    <tr className={bon.actif ? "" : "opacity-50"}>
      <td className="border px-2 py-1">{bon.numero_bl}</td>
      <td className="border px-2 py-1">{bon.fournisseur?.nom}</td>
      <td className="border px-2 py-1">{bon.date_reception}</td>
      <td className="border px-2 py-1 text-right">{lignesCount}</td>
      <td className="border px-2 py-1 text-right">{montant.toFixed(2)} €</td>
      <td className="border px-2 py-1">{bon.actif ? "✅" : "❌"}</td>
      <td className="border px-2 py-1 space-x-1">
        {canEdit && (
          <>
            <Button size="sm" variant="outline" className="mr-2" onClick={() => onEdit(bon)}>
              Éditer
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" className="mr-2" onClick={() => onDetail(bon)}>
          Détail
        </Button>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => onToggleActive(bon.id, !bon.actif)}>
            {bon.actif ? "Désactiver" : "Réactiver"}
          </Button>
        )}
      </td>
    </tr>
  );
}
