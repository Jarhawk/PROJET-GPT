import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toStr, validOptions } from "@/utils/selectSafe";

export default function FactureLigne({ value: ligne, onChange, onRemove, zones = [], openPicker, index }) {
  const lineRef = useRef(null);

  const zoneOptions = validOptions(zones || [], 'id');
  const TVA_OPTIONS = [0, 5.5, 10, 20]; // adapte si ta config TVA est dynamique

  const qte = Number(ligne?.quantite || 0);
  const total = Number(ligne?.prix_total_ht || 0);
  const tva = Number(ligne?.tva || 0);
  const pu = qte > 0 ? total / qte : 0;

  const recalc = (patch = {}) => {
    const q = patch.quantite !== undefined ? Number(patch.quantite) : qte;
    const lht = patch.prix_total_ht !== undefined ? Number(patch.prix_total_ht) : total;
    const tv = patch.tva !== undefined ? Number(patch.tva) : tva;
    const pu_ht = q > 0 ? lht / q : 0;
    onChange({
      ...ligne,
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
          value={ligne?.produit_nom || ""}
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
      <Input readOnly tabIndex={-1} value={ligne?.unite || ""} placeholder="Unité" />

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
      <Input readOnly tabIndex={-1} value={fmt(Number(ligne?.pmp ?? 0))} placeholder="PMP" />

      {/* TVA % */}
      <Select
        value={toStr(ligne?.tva)}
        onValueChange={(v) => onChange({ tva: Number(v) })}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="TVA (%)" />
        </SelectTrigger>
        <SelectContent>
          {TVA_OPTIONS.map((t) => (
            <SelectItem key={t} value={String(t)}>
              {t}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Zone */}
      <Select
        value={toStr(ligne?.zone_id)}
        onValueChange={(v) => onChange({ zone_id: v === '__none__' ? null : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Zone (optionnel)" />
        </SelectTrigger>
        <SelectContent>
          {/* Si tu veux une option "Aucune", utiliser une vraie valeur sentinelle */}
          <SelectItem value="__none__">Aucune</SelectItem>
          {zoneOptions.map((z) => (
            <SelectItem key={z.id} value={String(z.id)}>
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

