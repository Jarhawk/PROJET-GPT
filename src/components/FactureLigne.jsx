// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
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

  async function handleProduitSelection(name) {
    const match = produitOptions.find(p => p.nom === name);
    if (match) {
      onChange({
        ...ligne,
        produit_nom: match.nom,
        produit_id: match.id,
        unite: match.unite || "",
        prix_unitaire: match.dernier_prix ?? ligne.prix_unitaire,
        tva: match.tva ?? ligne.tva,
      });
      setLoadingProd(true);
      const prod = await getProduct(match.id);
      onChange({ ...ligne, zone_stock_id: prod?.zone_stock_id || "" });
      setLoadingProd(false);
    } else {
      onChange({ ...ligne, produit_nom: name, produit_id: "" });
      if (name.length >= 2) searchProduits(name);
    }
  }

  function update(field, value) {
    onChange({ ...ligne, [field]: value });
  }

  return (
    <tr className="h-10">
      <td className="p-1 align-middle">
        <Input
          list={`produits-${index}`}
          required
          value={ligne.produit_nom}
          onChange={e => handleProduitSelection(e.target.value)}
          className="h-10 min-w-[30ch] text-black"
        />
        <datalist id={`produits-${index}`}>
          {produitOptions.map(p => (
            <option key={p.id} value={p.nom} />
          ))}
        </datalist>
      </td>
      <td className="p-1 align-middle">
        <Input
          type="number"
          required
          className="h-10 w-full text-black"
          value={ligne.quantite}
          onChange={e => update("quantite", Number(e.target.value))}
        />
      </td>
      <td className="text-center p-1 align-middle">{ligne.unite}</td>
      <td className="p-1 align-middle">
        <Input
          type="number"
          className="h-10 w-full text-black"
          value={ligne.prix_unitaire}
          onChange={e => update("prix_unitaire", Number(e.target.value))}
        />
      </td>
      <td className="p-1 align-middle w-14">
        <Input
          type="number"
          className="h-10 w-full text-black"
          title="Taux de TVA appliqué"
          required
          value={ligne.tva}
          onChange={e => update("tva", Number(e.target.value))}
        />
      </td>
      <td className="min-w-[120px] p-1 align-middle">
        <AutoCompleteZoneField
          value={ligne.zone_stock_id}
          onChange={obj => update("zone_stock_id", obj?.id || "")}
          disabled={loadingProd}
          required
          className="h-10 text-black"
        />
      </td>
      <td className="p-1 align-middle text-center">
        <Checkbox
          checked={ligne.majProduit}
          onChange={e => update("majProduit", e.target.checked)}
        />
      </td>
      <td className="text-right p-1 align-middle">
        {(ligne.quantite * ligne.prix_unitaire * (1 + (ligne.tva || 0) / 100)).toFixed(2)}
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
