import { Button } from "@/components/ui/button";

export default function FicheRow({ fiche, onEdit, onDetail, onDuplicate, onDelete, canEdit }) {
  return (
    <tr className={fiche.actif ? "" : "opacity-50"}>
      <td className="border px-4 py-2">
        <Button
          variant="link"
          className="font-semibold text-white"
          onClick={() => onDetail(fiche)}
        >
          {fiche.nom}
        </Button>
      </td>
      <td className="border px-4 py-2">{fiche.famille_nom || "—"}</td>
      <td className="border px-4 py-2 text-right">
        {Number(fiche.cout_par_portion).toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </td>
      <td className="border px-4 py-2 text-right">{fiche.lignes?.length || 0}</td>
      <td className="border px-4 py-2">{fiche.actif ? "✅" : "❌"}</td>
      <td className="border px-4 py-2">
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="mr-2"
              onClick={() => onEdit(fiche)}
            >
              Modifier
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="mr-2"
          onClick={() => onDetail(fiche)}
        >
          Voir
        </Button>
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="mr-2"
              onClick={() => onDuplicate(fiche.id)}
            >
              Dupliquer
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(fiche.id)}
            >
              Désactiver
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
