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
      <td
        className="px-2 min-w-[30ch] truncate"
        title={produit.nom}
      >
        {produit.nom}
      </td>
      <td
        className="px-2 truncate"
        title={`${produit.famille?.nom || ""}${produit.sous_famille ? ` > ${produit.sous_famille.nom}` : ""}`}
      >
        {produit.famille?.nom} {produit.sous_famille ? `> ${produit.sous_famille.nom}` : ""}
      </td>
      <td
        className="px-2 truncate"
        title={produit.zone_stock?.nom || "-"}
      >
        {produit.zone_stock?.nom || "-"}
      </td>
      <td className="px-2 text-center">{produit.unite?.nom ?? produit.unite ?? ""}</td>
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
      <td className="px-2 text-right">{produit.seuil_min ?? "-"}</td>
      <td
        className="px-2 truncate"
        title={produit.main_fournisseur?.nom || "-"}
      >
        {produit.main_fournisseur?.nom || "-"}
      </td>
      <td className="px-2 text-right">
        {produit.dernier_prix != null
          ? Number(produit.dernier_prix).toFixed(2)
          : "-"}
      </td>
      <td className="px-2 text-center">{produit.actif ? "✅" : "❌"}</td>
      <td className="px-2 whitespace-nowrap min-w-[100px]">
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onDetail(produit)}>
            Voir
          </Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(produit)}>
                Éditer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onToggleActive(produit.id, !produit.actif)}
              >
                {produit.actif ? "Désactiver" : "Activer"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate(produit.id)}
              >
                Dupliquer
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
