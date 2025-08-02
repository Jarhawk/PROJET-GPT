import { Button } from "@/components/ui/button";

export default function ProduitRow({
  produit,
  onEdit,
  onDetail,
  onDuplicate,
  onToggleActive,
  canEdit,
}) {
  return (
    <tr className={produit.actif ? "" : "opacity-50"}>
      <td>{produit.nom}</td>
      <td>{produit.famille}</td>
      <td>{produit.zone_stock?.nom || "-"}</td>
      <td>{produit.unite}</td>
      <td className="text-right">{produit.pmp != null ? Number(produit.pmp).toFixed(2) : '-'}</td>
      <td className="text-right">{produit.stock_theorique}</td>
      <td className="text-right">{produit.stock_min}</td>
      <td>{produit.fournisseur?.nom || "-"}</td>
      <td className="text-right">
        {produit.dernier_prix != null
          ? Number(produit.dernier_prix).toFixed(2)
          : "-"}
      </td>
      <td>{produit.actif ? "✅" : "❌"}</td>
      <td>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onDetail(produit)}
          className="mr-2"
        >
          Voir
        </Button>
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="mr-2"
              onClick={() => onEdit(produit)}
            >
              Éditer
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="mr-2"
              onClick={() => onToggleActive(produit.id, !produit.actif)}
            >
              {produit.actif ? "Désactiver" : "Activer"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="mr-2"
              onClick={() => onDuplicate(produit.id)}
            >
              Dupliquer
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
