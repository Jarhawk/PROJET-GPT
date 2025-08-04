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
  const formatNum = v =>
    isNaN(v) ? "" : Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
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
          unite: prod?.unites?.nom || "",
          pmp: prod?.pmp ?? null,
        });
      } catch (error) {
        console.error(error);
        onChange({
          ...newLigne,
          zone_stock_id: "",
          unite_id: "",
          unite: "",
          pmp: null,
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
        pmp: null,
      });
      if (obj?.nom?.length >= 2) searchProduits(obj.nom);
    }
  }

  function handleQuantite(val) {
    const q = val;
    const qNum = parseNum(val);
    const pu = parseNum(ligne.pu);
    const t = parseNum(ligne.total_ht);
    let newLine = { ...ligne, quantite: q };
    if (ligne.pu) {
      newLine.total_ht = formatNum(qNum * pu);
    } else if (ligne.total_ht) {
      newLine.pu = qNum ? formatNum(t / qNum) : ligne.pu;
    }
    onChange(newLine);
  }

  function handleTotal(val) {
    const t = val;
    const tNum = parseNum(val);
    const q = parseNum(ligne.quantite);
    const newLine = {
      ...ligne,
      total_ht: t,
      pu: q ? formatNum(tNum / q) : ligne.pu,
    };
    onChange(newLine);
  }

  function handlePu(val) {
    const p = val;
    const pNum = parseNum(val);
    const q = parseNum(ligne.quantite);
    const newLine = {
      ...ligne,
      pu: p,
      total_ht: formatNum(q * pNum),
    };
    onChange(newLine);
  }
  const puNum = parseNum(ligne.pu);
  const pmp = parseNum(ligne.pmp);
  const variation = puNum > pmp ? "🔺" : puNum < pmp ? "🔻" : "⚪";

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
          onBlur={() => handleQuantite(formatNum(parseNum(ligne.quantite)))}
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
            type="text"
            className="h-10 w-full pr-6"
            value={ligne.total_ht}
            onChange={e => handleTotal(e.target.value)}
            onBlur={() => handleTotal(formatNum(parseNum(ligne.total_ht)))}
            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
        </div>
      </td>
      <td className="p-1 align-middle">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Input
              type="text"
              className="h-10 w-full pr-6"
              value={ligne.pu}
              onChange={e => handlePu(e.target.value)}
              onBlur={() => handlePu(formatNum(parseNum(ligne.pu)))}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
          </div>
          <span>{variation}</span>
        </div>
        {ligne.pmp != null && (
          <div className="text-xs text-gray-500">PMP: {formatNum(pmp)} €</div>
        )}
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
        <Input
          type="number"
          step="0.01"
          className="h-10 w-[6ch] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          title="Taux de TVA appliqué"
          required
          max={9999}
          value={ligne.tva}
          onChange={e => {
            const val = parseNum(e.target.value);
            onChange({ ...ligne, tva: Math.round(val * 100) / 100 });
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

