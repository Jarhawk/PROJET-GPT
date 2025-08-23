import { Button } from "@/components/ui/button";
import { Eye, Pencil, Archive } from "lucide-react";

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
      <td className="px-2 text-right">
        {produit.pmp != null ? Number(produit.pmp).toFixed(2) : "-"}
      </td>
      <td
        className={
          "px-2 text-right" + (belowMin ? " text-red-600 font-semibold" : "")
        }
      >
        {produit.stock_theorique}
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDetail(produit)}
            aria-label="Voir"
            title="Voir"
          >
            <Eye size={16} />
          </Button>
          {canEdit && (
            <>
              <Button
                size="sm"
                onClick={() => onEdit(produit)}
                aria-label="Modifier"
                title="Modifier"
              >
                <Pencil size={16} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleActive(produit.id, !produit.actif)}
                aria-label={produit.actif ? "Désactiver" : "Activer"}
                title={produit.actif ? "Désactiver" : "Activer"}
              >
                <Archive size={16} />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
