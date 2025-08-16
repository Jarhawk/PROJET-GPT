// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import AutocompleteProduit from "@/components/forms/AutocompleteProduit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { useState, useEffect, useRef, useCallback } from "react";
import supabase from "@/lib/supabaseClient";

const PRODUIT_COLUMNS = ["tva", "zone_id", "zone_stock_id"];
const firstExisting = (keys) => keys.find((k) => PRODUIT_COLUMNS.includes(k));

function toLabel(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return toLabel(v[0]);
  if (typeof v === 'object')
    return (
      v.nom ??
      v.name ??
      v.label ??
      v.code ??
      v.abbr ??
      v.abreviation ??
      v.symbol ??
      v.symbole ??
      v.id ??
      ''
    ) + '';
  return String(v);
}

export default function FactureLigne({
  ligne,
  index,
  onChange,
  onRemove,
  lineKey,
  onProduitFocus,
}) {
  const { getProduct } = useProducts();
  const { zones, fetchZones } = useZones();
  const [loadingProd, setLoadingProd] = useState(false);
  const parseNum = v => parseFloat(String(v).replace(',', '.')) || 0;
  const lastPushed = useRef({ tva: ligne.tva, zone_id: ligne.zone_id });
  const updateProduitMeta = useCallback(async (id, { tva, zone_id }) => {
    const fields = {};
    if (tva !== undefined) {
      const tvaKey = firstExisting(["tva_rate", "tva", "taux_tva"]);
      if (tvaKey) fields[tvaKey] = Number(tva);
    }
    if (zone_id !== undefined) {
      const zoneKey = firstExisting(["default_zone_id", "zone_id", "zone_stock_id"]);
      if (zoneKey) fields[zoneKey] = zone_id;
    }
    if (Object.keys(fields).length === 0) return;
    const { error } = await supabase
      .from("produits")
      .update(fields)
      .eq("id", id)
      .limit(1);
    if (error) {
      console.info("[produits] write-through meta failed", {
        id,
        fields,
        code: error.code,
        message: error.message,
      });
    }
  }, []);

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lastPushed.current = { tva: ligne.tva, zone_id: ligne.zone_id };
  }, [ligne.produit_id]);

  async function handleProduitSelection(obj) {
    if (obj?.id) {
      const q = parseNum(ligne.quantite);
      const puBase =
        obj.prix_unitaire ?? obj.price_ht ?? obj.dernier_prix ?? 0;
      const initial = {
        ...ligne,
        produit: obj,
        produit_id: obj.id,
        unite: obj.unite_achat || obj.unite || "",
        pu: (puBase || 0).toFixed(2),
        pmp: obj.pmp ?? obj.pmp_ht ?? ligne.pmp,
        tva: obj.tva ?? obj.tva_rate ?? ligne.tva ?? 20,
        zone_id: obj.zone_id || obj.zone_stock_id || ligne.zone_id || "",
        total_ht: (q * (puBase || 0)).toFixed(2),
        manuallyEdited: false,
      };
      onChange(initial);
      setLoadingProd(true);
      try {
        const prod = await getProduct(obj.id);
        const unite =
          prod?.unite_achat ||
          prod?.unite ||
          prod?.unite_principale ||
          obj.unite_achat ||
          obj.unite ||
          "Unité";
        const pu =
          prod?.dernier_prix_ht ??
          prod?.prix_unitaire ??
          prod?.price_ht ??
          obj.prix_unitaire ??
          obj.price_ht ??
          obj.dernier_prix ??
          puBase;
        const pmp = prod?.pmp_ht ?? prod?.pmp ?? obj.pmp ?? obj.pmp_ht ?? 0;
        const tva =
          prod?.tva_rate ??
          prod?.tva ??
          prod?.taux_tva ??
          initial.tva;
        const zone =
          prod?.default_zone_id ??
          prod?.zone_id ??
          prod?.zone_stock_id ??
          obj.zone_id ??
          obj.zone_stock_id ??
          null;
        const updated = {
          ...initial,
          unite,
          pu: (pu || 0).toFixed(2),
          pmp,
          tva,
          zone_id: zone || "",
          total_ht: (q * (pu || 0)).toFixed(2),
        };
        onChange(updated);
        lastPushed.current = { tva, zone_id: zone || "" };
      } catch (error) {
        console.error(error);
        lastPushed.current = { tva: initial.tva, zone_id: initial.zone_id };
      }
      setLoadingProd(false);
    } else {
      onChange({
        ...ligne,
        produit: obj?.id ? obj : { id: '', nom: obj?.nom || '' },
        produit_id: "",
        zone_id: "",
        unite: "",
        pu: "0",
        pmp: 0,
        total_ht: "0",
        manuallyEdited: false,
      });
    }
  }

  function handleQuantite(val) {
    const replaced = String(val).replace(',', '.');
    const qNum = parseFloat(replaced);
    const newLine = { ...ligne, quantite: val };
    if (!isNaN(qNum)) {
      const pu = parseNum(ligne.pu);
      if (!ligne.manuallyEdited) {
        newLine.total_ht = (qNum * pu).toFixed(2);
      } else {
        const total = parseNum(ligne.total_ht);
        newLine.pu = qNum ? (total / qNum).toFixed(2) : "0";
      }
    }
    onChange(newLine);
  }

  function handleTotal(val) {
    const replaced = String(val).replace(',', '.');
    const tNum = parseFloat(replaced);
    const q = parseNum(ligne.quantite);
    const newLine = {
      ...ligne,
      total_ht: val,
      manuallyEdited: true,
    };
    if (!isNaN(tNum)) {
      newLine.pu = q ? (tNum / q).toFixed(2) : "0";
    }
    onChange(newLine);
  }

  const puNum = parseNum(ligne.pu);
  const pmp = parseNum(ligne.pmp);

  const handleTvaBlur = () => {
    if (!ligne.produit_id) return;
    if (lastPushed.current.tva === ligne.tva) return;
    lastPushed.current.tva = ligne.tva;
    updateProduitMeta(ligne.produit_id, { tva: ligne.tva });
  };

  const handleZoneBlur = () => {
    if (!ligne.produit_id) return;
    if (lastPushed.current.zone_id === ligne.zone_id) return;
    lastPushed.current.zone_id = ligne.zone_id;
    updateProduitMeta(ligne.produit_id, { zone_id: ligne.zone_id });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="basis-[20%] shrink-0">
        <AutocompleteProduit
          value={ligne.produit}
          onChange={handleProduitSelection}
          lineKey={lineKey}
          onFocus={() => onProduitFocus?.(index)}
          required
          placeholder="Nom du produit..."
          className="h-10 w-full"
        />
      </div>
      <div className="basis-[10%] shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          required
          className="h-10 w-full text-right rounded-xl"
          value={ligne.quantite}
          onChange={(e) => handleQuantite(e.target.value)}
          onBlur={() => handleQuantite(String(parseNum(ligne.quantite)))}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        />
      </div>
      <div className="basis-[10%] shrink-0">
        <Input
          type="text"
          readOnly
          tabIndex={-1}
          value={toLabel(
            ligne.unite ??
            ligne?.produit?.unite_achat ??
            ligne?.produit?.unite ??
            ligne?.produit?.unite_principale
          )}
          className="h-10 w-full pointer-events-none select-none rounded-xl"
          aria-readonly="true"
        />
      </div>
      <div className="basis-[10%] shrink-0">
        <div className="relative">
          <Input
            type="text"
            tabIndex={-1}
            className="h-10 w-full pr-6 text-right rounded-xl"
            value={ligne.total_ht}
            onChange={(e) => handleTotal(e.target.value)}
            onBlur={() => handleTotal(parseNum(ligne.total_ht).toFixed(2))}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
        </div>
      </div>
      <div className="basis-[10%] shrink-0">
        <Input
          type="text"
          readOnly
          tabIndex={-1}
          value={toLabel(ligne.pu)}
          className={`h-10 w-full text-right rounded-xl pointer-events-none select-none ${puNum > pmp ? 'text-red-500' : puNum < pmp ? 'text-green-500' : ''}`}
          aria-readonly="true"
        />
      </div>
      <div className="basis-[10%] shrink-0">
        <div className="relative">
          <Input
            type="text"
            readOnly
            tabIndex={-1}
            value={toLabel(ligne.pmp)}
            className="h-10 w-full text-right pr-4 rounded-xl pointer-events-none select-none"
            aria-readonly="true"
          />
          {puNum !== pmp && (
            <span className={`absolute right-1 top-1/2 -translate-y-1/2 ${puNum > pmp ? 'text-red-500' : 'text-green-500'}`}>{puNum > pmp ? '▲' : '▼'}</span>
          )}
        </div>
      </div>
      <div className="basis-[10%] shrink-0">
        <div className="relative">
          <Input
            type="number"
            className="h-10 w-full text-right rounded-xl pr-4"
            value={ligne.tva}
            onChange={(e) => onChange({ ...ligne, tva: e.target.value })}
            onBlur={handleTvaBlur}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">%</span>
        </div>
      </div>
      <div className="basis-[15%] shrink-0">
        <Select
          value={ligne.zone_id}
          onChange={(e) => onChange({ ...ligne, zone_id: e.target.value })}
          onBlur={handleZoneBlur}
          disabled={loadingProd}
          required
          className="h-10 w-full rounded-xl"
        >
          <option value="">Choisir...</option>
          {zones
            .filter((z) => z.actif)
            .map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
        </Select>
      </div>
      <div className="basis-[5%] shrink-0 flex justify-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onRemove?.(index)}
          className="h-10 px-2"
        >
          ❌
        </Button>
      </div>
    </div>
  );
}

