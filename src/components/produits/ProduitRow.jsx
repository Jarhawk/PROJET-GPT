import { Button } from "@/components/ui/button";

export default function ProduitRow({
  produit,
  onEdit,
  onDetail,
  onDuplicate,
  onToggleActive,
  canEdit,
}) {
  const belowMin =
    produit.stock_theorique != null &&
    produit.seuil_min != null &&
    produit.stock_theorique < produit.seuil_min;
  const rupture = produit.stock_theorique === 0;
  return (
    <tr className={produit.actif ? "" : "opacity-50 bg-muted"}>
      <td className="truncate max-w-[200px]">{produit.nom}</td>
      <td>{produit.famille?.nom} {produit.sous_famille ? `> ${produit.sous_famille.nom}` : ""}</td>
      <td className="truncate max-w-[160px]">{produit.zone_stock?.nom || "-"}</td>
      <td>{produit.unite}</td>
      <td className="text-right">{produit.pmp != null ? Number(produit.pmp).toFixed(2) : "-"}</td>
      <td className={"text-right" + (belowMin ? " text-red-600 font-semibold" : "") }>
        {produit.stock_theorique}
        {rupture && <span className="ml-1 text-red-600">⚠️</span>}
      </td>
      <td className="text-right">{produit.seuil_min ?? "-"}</td>
      <td>{produit.main_fournisseur?.nom || "-"}</td>
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
