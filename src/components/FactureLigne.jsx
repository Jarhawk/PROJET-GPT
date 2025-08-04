// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Input } from "@/components/ui/input";
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
  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  async function handleProduitSelection(obj) {
    if (obj?.id) {
      const newLigne = {
        ...ligne,
        produit_nom: obj.nom,
        produit_id: obj.id,
        tva: obj.tva ?? ligne.tva,
      };
      onChange(newLigne);
      setLoadingProd(true);
      try {
        const prod = await getProduct(obj.id);
        onChange({ ...newLigne, zone_stock_id: prod?.zone_stock_id || "" });
      } catch (error) {
        console.error(error);
        onChange({ ...newLigne, zone_stock_id: "" });
      }
      setLoadingProd(false);
    } else {
      onChange({
        ...ligne,
        produit_nom: obj?.nom || "",
        produit_id: "",
        zone_stock_id: "",
      });
      if (obj?.nom?.length >= 2) searchProduits(obj.nom);
    }
  }

  function update(field, value) {
    onChange({ ...ligne, [field]: value });
  }

  const prixUnitaire =
    ligne.quantite ? (Number(ligne.total_ht) || 0) / Number(ligne.quantite) : 0;

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
      <td className="p-1 align-middle">
        <Input
          type="number"
          required
          className="h-10 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={ligne.total_ht}
          onChange={e => update("total_ht", e.target.value)}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
      </td>
      <td className="p-1 align-middle">
        <Input
          type="number"
          readOnly
          className="h-10 w-full bg-gray-100 text-gray-700"
          value={prixUnitaire.toFixed(2)}
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
      <td className="p-1 align-middle">
        <Input
          type="number"
          className="h-10 w-[4ch] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          title="Taux de TVA appliqué"
          required
          max={9999}
          value={ligne.tva}
          onChange={e => update("tva", Number(e.target.value))}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
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

