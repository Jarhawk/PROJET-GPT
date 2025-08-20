import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function FactureLigne({ value, onChange, onRemove, zones, openPicker }) {
  const q   = Number(value?.quantite || 0);
  const lht = Number(value?.prix_total_ht || 0);
  const pu  = q > 0 ? lht / q : 0;

  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-[minmax(240px,1.4fr)_minmax(90px,0.6fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(120px,0.9fr)] gap-3 items-center overflow-x-hidden">
      {/* Produit (picker) */}
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={value?.produit_nom || ""}
          placeholder="Aucun produit"
        />
        <Button type="button" variant="outline" onClick={openPicker}>Choisir un produit</Button>
      </div>

      {/* Quantité (editable) */}
      <Input
        type="number"
        step="0.01"
        value={value?.quantite ?? ""}
        onChange={(e) => update({ quantite: e.target.value })}
        placeholder="Qté"
        autoComplete="off"
        name="no-autofill"
      />

      {/* Unité (readonly, disabled for visual distinction) */}
      <Input
        readOnly
        disabled
        value={value?.unite || ""}
        placeholder="Unité"
      />

      {/* Prix total HT (€) editable */}
      <Input
        type="number"
        step="0.01"
        value={value?.prix_total_ht ?? ""}
        onChange={(e) => update({ prix_total_ht: e.target.value })}
        placeholder="Total HT (€)"
        autoComplete="off"
        name="no-autofill"
      />

      {/* Prix unitaire calculé (€) readonly */}
      <Input
        readOnly
        disabled
        value={Number.isFinite(pu) ? pu.toFixed(4) : ""}
        placeholder="PU HT (€)"
      />

      {/* PMP (readonly) */}
      <Input
        readOnly
        disabled
        value={Number(value?.pmp ?? 0).toFixed(2)}
        placeholder="PMP"
      />

      {/* TVA % (prefill; editable) */}
      <Input
        type="number"
        step="0.01"
        value={value?.tva ?? ""}
        onChange={(e) => update({ tva: e.target.value })}
        placeholder="TVA %"
        autoComplete="off"
        name="no-autofill"
      />

      {/* Zone (prefill if known; editable) + Supprimer */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select value={value?.zone_id || ""} onValueChange={(v) => update({ zone_id: v })}>
            <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent align="start" className="max-h-64 overflow-auto">
              {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" className="text-destructive" onClick={onRemove}>Supprimer</Button>
      </div>
    </div>
  );
}

