// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import AutoCompleteZoneField from "@/components/ui/AutoCompleteZoneField";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useState } from "react";

export default function FactureLigne({
  ligne,
  index,
  onChange,
  onRemove,
  produitOptions = [],
  searchProduits,
}) {
  const { getProduct } = useProducts();
  const [loadingProd, setLoadingProd] = useState(false);

  async function handleProduit(obj) {
    onChange({
      ...ligne,
      produit_nom: obj?.nom_simple || obj?.nom || "",
      produit_id: obj?.id || "",
      unite: obj?.unite || "",
      prix_unitaire: obj?.dernier_prix ?? ligne.prix_unitaire,
      tva: obj?.tva ?? ligne.tva,
    });
    if (obj?.id) {
      setLoadingProd(true);
      const prod = await getProduct(obj.id);
      onChange({ ...ligne, zone_stock_id: prod?.zone_stock_id || "" });
      setLoadingProd(false);
    }
    const searchVal = obj?.nom_simple || obj?.nom || "";
    if (searchVal.length >= 2) searchProduits(searchVal);
  }

  function update(field, value) {
    onChange({ ...ligne, [field]: value });
  }

  return (
    <tr>
      <td className="min-w-[200px]">
        <AutoCompleteField
          id={`produit-${index}`}
          required
          label=""
          value={ligne.produit_id}
          onChange={async obj => {
            if (obj?.id && obj.id !== ligne.produit_id) {
              handleProduit(obj);
            } else if (!obj?.id) {
              update("produit_id", "");
            }
          }}
          options={produitOptions}
        />
      </td>
      <td>
        <Input
          type="number"
          required
          className="w-full"
          value={ligne.quantite}
          onChange={e => update("quantite", Number(e.target.value))}
        />
      </td>
      <td className="text-center">{ligne.unite}</td>
      <td>
        <Input
          type="number"
          className="w-full"
          value={ligne.prix_unitaire}
          onChange={e => update("prix_unitaire", Number(e.target.value))}
        />
      </td>
      <td>
        <Input
          type="number"
          className="w-full"
          title="Taux de TVA appliqué"
          value={ligne.tva}
          onChange={e => update("tva", Number(e.target.value))}
        />
      </td>
      <td className="min-w-[120px]">
        <AutoCompleteZoneField
          label=""
          value={ligne.zone_stock_id}
          onChange={obj => update("zone_stock_id", obj?.id || "")}
          disabled={loadingProd}
        />
      </td>
      <td className="text-center">
        <Checkbox
          checked={ligne.majProduit}
          onChange={e => update("majProduit", e.target.checked)}
        />
      </td>
      <td className="text-right">
        {(ligne.quantite * ligne.prix_unitaire * (1 + (ligne.tva || 0) / 100)).toFixed(2)}
      </td>
      <td>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onRemove?.(index)}
        >
          X
        </Button>
      </td>
    </tr>
  );
}
