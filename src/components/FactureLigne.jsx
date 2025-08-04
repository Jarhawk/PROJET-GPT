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
  const parseNum = v => parseFloat(String(v).replace(',', '.')) || 0;
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
        onChange({
          ...newLigne,
          zone_stock_id: prod?.zone_stock_id || "",
          unite_id: prod?.unite_id || "",
          unite: prod?.unite?.nom || "",
          pmp: prod?.pmp ?? 0,
        });
      } catch (error) {
        console.error(error);
        onChange({
          ...newLigne,
          zone_stock_id: "",
          unite_id: "",
          unite: "",
          pmp: 0,
        });
      }
      setLoadingProd(false);
    } else {
      onChange({
        ...ligne,
        produit_nom: obj?.nom || "",
        produit_id: "",
        zone_stock_id: "",
        unite_id: "",
        unite: "",
        pmp: 0,
      });
      if (obj?.nom?.length >= 2) searchProduits(obj.nom);
    }
  }

  function handleQuantite(val) {
    const replaced = String(val).replace(',', '.');
    const qNum = parseFloat(replaced);
    if (!isNaN(qNum)) {
      const pu = parseNum(ligne.pu);
      const newLine = { ...ligne, quantite: qNum };
      if (!ligne.manuallyEdited) {
        newLine.total_ht = parseFloat((qNum * pu).toFixed(2));
      }
      onChange(newLine);
    }
  }

  function handleTotal(val) {
    const replaced = String(val).replace(',', '.');
    const tNum = parseFloat(replaced);
    const isValid = !isNaN(tNum);
    const q = parseNum(ligne.quantite);
    const newLine = {
      ...ligne,
      total_ht: isValid ? parseFloat(tNum.toFixed(2)) : 0,
      pu: q ? (isValid ? parseFloat((tNum / q).toFixed(2)) : 0) : 0,
      manuallyEdited: true,
    };
    onChange(newLine);
  }

  const puNum = parseNum(ligne.pu);
  const pmp = parseNum(ligne.pmp);

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
          type="text"
          required
          className="h-10 w-full"
          value={ligne.quantite}
          onChange={e => handleQuantite(e.target.value)}
          onBlur={() => handleQuantite(ligne.quantite)}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
        />
      </td>
      <td className="p-1 align-middle h-10 text-center">
        <span>{ligne.unite || ""} | TVA {ligne.tva || 0}</span>
      </td>
      <td className="p-1 align-middle">
        <div className="relative">
          <Input
            type="text"
            className="h-10 w-full pr-6"
            value={ligne.total_ht}
            onChange={e => handleTotal(e.target.value)}
            onBlur={() => handleTotal(String(ligne.total_ht.toFixed(2)))}
            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
        </div>
      </td>
      <td className="p-1 align-middle">
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0.5rem" }}>
          <span><strong>PU:</strong> {puNum.toFixed(2)} €</span>
          <span style={{ color: "gray" }}><strong>PMP:</strong> {pmp.toFixed(2)} €</span>
        </div>
      </td>
      <td className="min-w-[20ch] p-1 align-middle">
        <Select
          value={ligne.zone_stock_id}
          onChange={e => onChange({ ...ligne, zone_stock_id: e.target.value })}
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

