import { Eye, Edit, Trash2, Check } from "lucide-react";
import Button from "@/components/ui/button";

export default function FournisseurRow({ fournisseur, productCount, onDetail, onEdit, onToggleActive, canEdit }) {
  return (
    <tr className={fournisseur.actif ? "" : "opacity-50"}>
      <td className="py-1 px-3 font-semibold text-white">{fournisseur.nom}</td>
      <td>{fournisseur.contact?.tel}</td>
      <td>{fournisseur.contact?.nom}</td>
      <td>{fournisseur.contact?.email}</td>
      <td className="text-right">{productCount}</td>
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
              onClick={() => onToggleActive(fournisseur.id, !fournisseur.actif)}
              aria-label={fournisseur.actif ? "Désactiver" : "Activer"}
            >
              {fournisseur.actif ? <Trash2 size={16} /> : <Check size={16} />}
              <span className="hidden sm:inline">{fournisseur.actif ? "Désactiver" : "Activer"}</span>
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
