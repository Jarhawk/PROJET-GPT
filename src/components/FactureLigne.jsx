// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { useState, useEffect } from "react";

export default function FactureLigne({
  ligne,
  index,
  onChange,
  onRemove,
  produitOptions = [],
  searchProduits,
}) {
  const { getProduct } = useProducts();
  const { zones, fetchZones } = useZones();
  const [loadingProd, setLoadingProd] = useState(false);
  useEffect(() => { fetchZones(); }, [fetchZones]);

  async function handleProduitSelection(obj) {
    if (obj?.id) {
      const newLigne = {
        ...ligne,
        produit_nom: obj.nom,
        produit_id: obj.id,
        unite: obj.unite || "",
        prix_unitaire:
          obj.dernier_prix != null ? String(obj.dernier_prix) : ligne.prix_unitaire,
        tva: obj.tva ?? ligne.tva,
      };
      onChange(newLigne);
      setLoadingProd(true);
      const prod = await getProduct(obj.id);
      onChange({ ...newLigne, zone_stock_id: prod?.zone_stock_id || "" });
      setLoadingProd(false);
    } else {
      onChange({
        ...ligne,
        produit_nom: obj?.nom || "",
        produit_id: "",
        unite: "",
        prix_unitaire: "",
        zone_stock_id: "",
      });
      if (obj?.nom?.length >= 2) searchProduits(obj.nom);
    }
  }

  function update(field, value) {
    onChange({ ...ligne, [field]: value });
  }

  return (
    <tr className="h-10">
      <td className="p-1 align-middle">
        <AutoCompleteField
          value={ligne.produit_nom}
          onChange={handleProduitSelection}
          options={produitOptions}
          required
          className="h-10 min-w-[30ch]"
        />
      </td>
      <td className="p-1 align-middle">
        <Input
          type="number"
          required
          className="h-10 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={ligne.quantite}
          onChange={e => update("quantite", Number(e.target.value))}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
      </td>
      <td className="text-center p-1 align-middle">{ligne.unite}</td>
      <td className="p-1 align-middle">
        <Input
          type="number"
          className="h-10 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={ligne.prix_unitaire}
          onChange={e => update("prix_unitaire", e.target.value)}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
      </td>
      <td className="p-1 align-middle w-16">
        <Input
          type="number"
          className="h-10 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          title="Taux de TVA appliqué"
          required
          max={9999}
          value={ligne.tva}
          onChange={e => update("tva", Number(e.target.value))}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
      </td>
      <td className="min-w-[120px] p-1 align-middle">
        <Select
          value={ligne.zone_stock_id}
          onChange={e => update("zone_stock_id", e.target.value)}
          disabled={loadingProd}
          required
          className="h-10 w-full"
        >
          <option value="">Choisir...</option>
          {zones
            .filter(z => z.actif)
            .map(z => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
        </Select>
      </td>
      <td className="p-1 align-middle text-center">
        <Checkbox
          checked={ligne.majProduit}
          onChange={e => update("majProduit", e.target.checked)}
        />
      </td>
      <td className="text-right p-1 align-middle">
        {
          (
            Number(ligne.quantite) *
            (Number(ligne.prix_unitaire) || 0) *
            (1 + (Number(ligne.tva) || 0) / 100)
          ).toFixed(2)
        }
      </td>
      <td className="p-1 align-middle">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onRemove?.(index)}
          className="h-10 px-2"
        >
          X
        </Button>
      </td>
    </tr>
  );
}
