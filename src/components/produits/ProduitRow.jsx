import { formatEUR, formatQty } from "@/utils/number";
import { Button } from "@/components/ui/button";

export default function ProduitRow({
  produit,
  onDetail,
  onEdit,
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
      <td
        className="px-2 min-w-[30ch] break-words"
        title={produit.nom}
      >
        {produit.nom}
      </td>
      <td className="px-2 text-center">{produit.unite?.nom ?? ""}</td>
      <td className="px-2 text-right">{formatEUR(produit.pmp)}</td>
      <td
        className={
          "px-2 text-right" + (belowMin ? " text-red-600 font-semibold" : "")
        }
      >
        {formatQty(produit.stock_theorique, 3)}
        {produit.unite?.nom ? ` ${produit.unite.nom}` : ""}
        {rupture && <span className="ml-1 text-red-600">⚠️</span>}
      </td>
      <td
        className="px-2 truncate"
        title={produit.zone_stock?.nom || "-"}
      >
        {produit.zone_stock?.nom || "-"}
      </td>
      <td className="px-2 whitespace-nowrap min-w-[100px]">
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onDetail(produit)}>
            Voir
          </Button>
          {canEdit && (
            <>
              <Button
                size="sm"
                onClick={() => onEdit(produit)}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleActive(produit.id, !produit.actif)}
              >
                {produit.actif ? "Désactiver" : "Activer"}
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
