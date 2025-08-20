import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export default function FactureLigne({ value, onChange, onRemove, zones = [], openPicker, index }) {
  const lineRef = useRef(null);

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

  const fmt = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";

  return (
    <div
      ref={lineRef}
      tabIndex={-1}
      className="grid gap-3 items-center grid-cols-[repeat(auto-fit,minmax(140px,1fr))] xl:grid-cols-[minmax(260px,1fr)_90px_110px_140px_140px_110px_110px_180px_60px]"
    >
      {/* Produit (picker) */}
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={value?.produit_nom || ""}
          placeholder="Choisir un produit…"
          onClick={() => openPicker(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); openPicker(index); }
            else if (e.key === 'Escape') { e.preventDefault(); lineRef.current?.focus(); }
          }}
          autoComplete="off"
          name="no-autofill"
          className="cursor-pointer"
        />
        <Button type="button" variant="outline" onClick={() => openPicker(index)}>
          Choisir un produit
        </Button>
      </div>

      {/* Qté */}
      <Input
        type="number"
        min="0"
        step="0.01"
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
        value={tva.toFixed(2)}
        onChange={(e) => recalc({ tva: e.target.value })}
        placeholder="TVA %"
        autoComplete="off"
        name="no-autofill"
      />

      {/* Zone */}
      <Select value={value?.zone_id || ""} onValueChange={(v) => recalc({ zone_id: v })}>
        <SelectTrigger>
          <span className="truncate">
            {zones.find((z) => z.id === value?.zone_id)?.nom || "Zone"}
          </span>
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

    </div>
  );
}

