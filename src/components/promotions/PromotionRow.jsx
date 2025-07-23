import { Button } from "@/components/ui/button";

export default function PromotionRow({ promotion, onEdit, onDelete, canEdit }) {
  return (
    <tr className="border-t">
      <td className="px-4 py-1 font-semibold text-mamastockGold">{promotion.nom}</td>
      <td className="px-4 py-1">{promotion.date_debut}</td>
      <td className="px-4 py-1">{promotion.date_fin || "-"}</td>
      <td className="px-4 py-1">{promotion.actif ? "Oui" : "Non"}</td>
      <td className="px-4 py-1 text-right">
        {canEdit && (
          <>
            <Button size="sm" variant="outline" className="mr-2" onClick={() => onEdit(promotion)}>
              Modifier
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(promotion.id)}>
              Supprimer
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
