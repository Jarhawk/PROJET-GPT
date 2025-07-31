import { Eye, Edit, Trash2 } from "lucide-react";

export default function FournisseurRow({ fournisseur, productCount, onDetail, onEdit, onDelete, canEdit }) {
  return (
    <tr className={fournisseur.actif ? "" : "opacity-50"}>
      <td className="py-1 px-3 font-semibold text-white">{fournisseur.nom}</td>
      <td>{fournisseur.contact?.tel}</td>
      <td>{fournisseur.contact?.nom}</td>
      <td>{fournisseur.contact?.email}</td>
      <td>{productCount}</td>
      <td className="py-2 px-3">
        <button
          className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded-xl flex items-center gap-1"
          onClick={() => onDetail(fournisseur.id)}
        >
          <Eye size={16} />
          <span className="hidden sm:inline">Voir</span>
        </button>
      </td>
      <td className="py-2 px-3">
        {canEdit && (
          <div className="flex gap-2">
            <button
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded-xl flex items-center gap-1"
              onClick={() => onEdit(fournisseur)}
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Modifier</span>
            </button>
            <button
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded-xl flex items-center gap-1"
              onClick={() => onDelete(fournisseur.id)}
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Désactiver</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
