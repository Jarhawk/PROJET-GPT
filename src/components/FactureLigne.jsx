import { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import ProductPickerModal from "@/components/forms/ProductPickerModal";

export default function FactureLigne({ value, onChange, onRemove, mamaId, lignes, zones }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const produitRef = useRef(null);

  const excludeIds = useMemo(
    () => (Array.isArray(lignes) ? lignes.map((l) => l.produit_id).filter(Boolean) : []),
    [lignes]
  );

  const qte = Number(value?.quantite || 0);
  const total = Number(value?.prix_total_ht || 0);
  const tva = Number(value?.tva || 0);
  const pu = qte > 0 ? total / qte : 0;

  const recalc = (patch = {}) => {
    const q = patch.quantite !== undefined ? Number(patch.quantite) : qte;
    const lht = patch.prix_total_ht !== undefined ? Number(patch.prix_total_ht) : total;
    const tv = patch.tva !== undefined ? Number(patch.tva) : tva;
    const pu_ht = q > 0 ? lht / q : 0;
    onChange({
      ...value,
      ...patch,
      quantite: +q.toFixed(2),
      prix_total_ht: +lht.toFixed(2),
      prix_unitaire_ht: +pu_ht.toFixed(6),
      tva: +Math.max(tv, 0).toFixed(2),
    });
  };

  const onPick = (p) => {
    recalc({
      produit_id: p.id,
      produit_nom: p.nom,
      unite: p.unite ?? "",
      pmp: Number(p.pmp ?? 0),
      tva: typeof p.tva === "number" ? p.tva : tva,
      zone_id: p.default_zone_id ?? value?.zone_id ?? "",
    });
  };

  const fmt = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";

  return (
    <div className="grid gap-3 items-center overflow-x-hidden grid-cols-[minmax(260px,1fr)_90px_110px_140px_140px_110px_110px_180px_60px]">
      {/* Produit (picker) */}
      <div className="flex items-center gap-2">
        <Input
          ref={produitRef}
          readOnly
          value={value?.produit_nom || ""}
          placeholder="Choisir un produit…"
          onClick={() => setPickerOpen(true)}
          autoComplete="off"
          name="no-autofill"
          className="cursor-pointer"
        />
        <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
          Rechercher
        </Button>
      </div>

      {/* Qté */}
      <Input
        type="number"
        min="0"
        step="0.01"
        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={qte}
        onChange={(e) => recalc({ quantite: e.target.value })}
        placeholder="Qté"
        autoComplete="off"
        name="no-autofill"
      />

      {/* Unité (RO) */}
      <Input readOnly tabIndex={-1} value={value?.unite || ""} placeholder="Unité" />

      {/* Total HT (€) */}
      <Input
        type="number"
        min="0"
        step="0.01"
        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={total.toFixed(2)}
        onChange={(e) => recalc({ prix_total_ht: e.target.value })}
        placeholder="Total HT (€)"
        autoComplete="off"
        name="no-autofill"
      />

      {/* PU HT (€) */}
      <Input readOnly tabIndex={-1} value={fmt(pu)} placeholder="PU HT (€)" />

      {/* PMP */}
      <Input readOnly tabIndex={-1} value={fmt(Number(value?.pmp ?? 0))} placeholder="PMP" />

      {/* TVA % */}
      <Input
        type="number"
        min="0"
        step="0.01"
        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={tva.toFixed(2)}
        onChange={(e) => recalc({ tva: e.target.value })}
        placeholder="TVA %"
        autoComplete="off"
        name="no-autofill"
      />

      {/* Zone */}
      <Select value={value?.zone_id || ""} onValueChange={(v) => recalc({ zone_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Zone" />
        </SelectTrigger>
        <SelectContent align="start" className="max-h-64 overflow-auto">
          <SelectItem value="">-</SelectItem>
          {zones.map((z) => (
            <SelectItem key={z.id} value={z.id}>
              {z.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Actions */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={onRemove}
      >
        <Trash2 size={16} />
      </Button>

      {/* Modal de sélection produit */}
      <ProductPickerModal
        open={pickerOpen}
        onOpenChange={(v) => {
          setPickerOpen(v);
          if (!v) produitRef.current?.focus();
        }}
        mamaId={mamaId}
        onPick={onPick}
        excludeIds={excludeIds}
      />
    </div>
  );
}

