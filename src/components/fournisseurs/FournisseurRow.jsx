import { Eye, Edit, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";

export default function FournisseurRow({ fournisseur, productCount, onDetail, onEdit, onDelete, canEdit }) {
  return (
    <tr className={fournisseur.actif ? "" : "opacity-50"}>
      <td className="py-1 px-3 font-semibold text-white">{fournisseur.nom}</td>
      <td>{fournisseur.contact?.tel}</td>
      <td>{fournisseur.contact?.nom}</td>
      <td>{fournisseur.contact?.email}</td>
      <td>{productCount}</td>
      <td className="py-2 px-3">
        <Button
          className="w-auto flex items-center gap-1"
          onClick={() => onDetail(fournisseur.id)}
          aria-label="Voir"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">Voir</span>
        </Button>
      </td>
      <td className="py-2 px-3">
        {canEdit && (
          <div className="flex gap-2">
            <Button
              className="w-auto flex items-center gap-1"
              onClick={() => onEdit(fournisseur)}
              aria-label="Modifier"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
            <Button
              className="w-auto flex items-center gap-1"
              onClick={() => onDelete(fournisseur.id)}
              aria-label="Désactiver"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Désactiver</span>
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
