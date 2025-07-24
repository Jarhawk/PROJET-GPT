import { Button } from "@/components/ui/button";

export default function ProduitRow({
  produit,
  onEdit,
  onDetail,
  onDuplicate,
  onDelete,
  canEdit,
}) {
  return (
    <tr className={produit.actif ? "" : "opacity-50"}>
      <td>{produit.nom}</td>
      <td>{produit.famille}</td>
      <td>{produit.unite}</td>
      <td>{produit.pmp != null ? Number(produit.pmp).toFixed(2) : '-'}</td>
      <td>{produit.stock_theorique}</td>
      <td>{produit.stock_min}</td>
      <td>{produit.fournisseur?.nom || "-"}</td> // ✅ Correction Codex
      <td>
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
              variant="ghost"
              className="mr-2"
              onClick={() => onDuplicate(produit.id)}
            >
              Dupliquer
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(produit.id)}
            >
              Supprimer
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
