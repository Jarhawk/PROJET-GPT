import { Button } from "@/components/ui/button";

export default function FournisseurRow({ fournisseur, productCount, onDetail, onEdit, onDelete, canEdit }) {
  return (
    <tr className={fournisseur.actif ? "" : "opacity-50"}>
      <td className="py-1 px-3 font-semibold text-white">{fournisseur.nom}</td>
      <td>{fournisseur.contact?.tel}</td>
      <td>{fournisseur.contact?.nom}</td>
      <td>{fournisseur.contact?.email}</td>
      <td>{productCount}</td>
      <td>
        <Button size="sm" variant="outline" onClick={() => onDetail(fournisseur.id)}>
          Voir détails
        </Button>
      </td>
      <td>
        {canEdit && (
          <>
            <Button size="sm" variant="outline" className="mr-2" onClick={() => onEdit(fournisseur)}>
              Modifier
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(fournisseur.id)}>
              Désactiver
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
