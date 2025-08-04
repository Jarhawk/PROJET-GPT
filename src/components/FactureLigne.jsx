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
        unite: obj.unite || ligne.unite || "",
      };
      onChange(newLigne);
      setLoadingProd(true);
      try {
        const prod = await getProduct(obj.id);
        onChange({
          ...newLigne,
          zone_stock_id: prod?.zone_stock_id || "",
          unite: prod?.unites?.nom || newLigne.unite,
        });
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
        unite: "",
      });
      if (obj?.nom?.length >= 2) searchProduits(obj.nom);
    }
  }

  function update(field, value) {
    onChange({ ...ligne, [field]: value });
  }

  const qte = Number(ligne.quantite) || 0;
  const ht = Number(ligne.total_ht) || 0;
  const prixUnitaire = qte ? ht / qte : 0;

  return (
    <tr className="h-10">
      <td className="p-1 align-middle">
        <AutoCompleteField
          value={ligne.produit_nom}
          onChange={handleProduitSelection}
          options={produitOptions}
          required
          placeholder="Nom du produit..."
          className="h-10 min-w-[40ch]"
        />
      </td>
      <td className="p-1 align-middle">
        <Input
          type="number"
          step="0.01"
          required
          className="h-10 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={ligne.quantite}
          onChange={e => {
            const val = e.target.value.replace(',', '.');
            update('quantite', Number(val));
          }}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
      </td>
      <td className="p-1 align-middle">
        <Input
          type="text"
          readOnly
          className="h-10 w-full bg-gray-100 text-gray-500"
          value={ligne.unite || ''}
        />
      </td>
      <td className="p-1 align-middle">
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            required
            className="h-10 w-full pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={ligne.total_ht}
            onChange={e => update('total_ht', e.target.value.replace(',', '.'))}
            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
        </div>
      </td>
      <td className="p-1 align-middle">
        <div className="relative">
          <Input
            type="number"
            readOnly
            className="h-10 w-full pr-6 bg-gray-100 text-gray-500"
            value={prixUnitaire.toFixed(2)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
        </div>
      </td>
      <td className="min-w-[20ch] p-1 align-middle">
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
          step="0.01"
          className="h-10 w-[6ch] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          title="Taux de TVA appliqué"
          required
          max={9999}
          value={ligne.tva}
          onChange={e => {
            const val = e.target.value.replace(',', '.');
            update('tva', Math.round(Number(val) * 100) / 100);
          }}
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

