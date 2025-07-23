import { Button } from "@/components/ui/button";

export default function AchatRow({ achat, onEdit, onDetail, onArchive, canEdit }) {
  return (
    <tr>
      <td className="border px-2 py-1">{achat.date_achat}</td>
      <td className="border px-2 py-1">{achat.produit?.nom}</td>
      <td className="border px-2 py-1">{achat.fournisseur?.nom}</td>
      <td className="border px-2 py-1 text-right">{achat.quantite}</td>
      <td className="border px-2 py-1 text-right">
        {Number(achat.prix || 0).toFixed(2)} €
      </td>
      <td className="border px-2 py-1 space-x-1">
        {canEdit && (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit(achat)} className="mr-2">
              Éditer
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onArchive(achat.id)} className="mr-2">
              Archiver
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => onDetail(achat)}>
          Détail
        </Button>
      </td>
    </tr>
  );
}
