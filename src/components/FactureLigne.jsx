import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import NumericInput from "@/components/forms/NumericInput";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import ProduitSearchModal from "@/components/factures/ProduitSearchModal";
export default function FactureLigne({
  value: line,
  onChange,
  onRemove,
  allLines = [],
  invalidProduit = false,
  index,
  zones = [],
}) {
  const lineRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);

  const qte = Number(line.quantite || 0);
  const totalHt = Number(line.total_ht || 0);
  const tva = Number(line.tva || 0);
  const puHt = qte > 0 ? +(totalHt / qte).toFixed(4) : 0;

  const recalc = (patch = {}) => {
    const q = patch.quantite !== undefined ? Number(patch.quantite) : qte;
    const lht = patch.total_ht !== undefined ? Number(patch.total_ht) : totalHt;
    const tv = patch.tva !== undefined ? Number(patch.tva) : tva;
    const pu = q > 0 ? +(lht / q).toFixed(4) : 0;
    const tvaMontant = +(lht * (tv / 100)).toFixed(2);
    const totalTtc = +(lht + tvaMontant).toFixed(2);
    onChange({
      ...line,
      ...patch,
      quantite: q,
      total_ht: lht,
      prix_total_ht: lht,
      pu_ht: pu,
      prix_unitaire_ht: pu,
      tva: tv,
      tva_montant: tvaMontant,
      total_ttc: totalTtc,
    });
  };

  const fmt = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";

  const excludeIdsSameZone = allLines
    .filter(
      (l) =>
        l.id !== line.id && (l.zone_id ?? null) === (line.zone_id ?? null) && !!l.produit_id
    )
    .map((l) => l.produit_id);

  const TVA_OPTIONS = [0, 5.5, 10, 20];

  return (
    <div
      ref={lineRef}
      tabIndex={-1}
      className="grid gap-3 items-center grid-cols-[repeat(auto-fit,minmax(140px,1fr))] xl:grid-cols-[minmax(260px,1fr)_90px_110px_140px_140px_110px_110px_180px_60px]"
    >
      <div className="flex gap-2">
        <Input
          className={`input w-full ${invalidProduit ? 'border-destructive' : ''}`}
          value={line.produit_nom || ""}
          readOnly
          placeholder="Choisir un produit"
          aria-invalid={invalidProduit ? 'true' : 'false'}
        />
        <Button type="button" onClick={() => setModalOpen(true)}>
          Choisir un produit
        </Button>
      </div>
      <ProduitSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(p) => {
          recalc({
            produit_id: p.produit_id,
            produit_nom: p.nom,
            unite_id: p.unite_id ?? null,
            tva: p.tva ?? 0,
            zone_id: p.zone_id ?? line.zone_id ?? null,
          });
        }}
        excludeIdsSameZone={excludeIdsSameZone}
        currentLineProductId={line.produit_id}
      />
      <NumericInput
        name={`lignes.${index}.quantite`}
        value={qte}
        onValueChange={(n) => recalc({ quantite: n })}
        placeholder="0"
      />
      <Input readOnly disabled value={line.unite || ""} placeholder="Unité" />
      <NumericInput
        name={`lignes.${index}.total_ht`}
        value={totalHt}
        decimals={2}
        min={0}
        onValueChange={(n) => recalc({ total_ht: n })}
        placeholder="0,00"
      />
      <Input readOnly disabled value={fmt(puHt)} placeholder="PU HT (€)" />
      <Input readOnly disabled value={fmt(Number(line.pmp ?? 0))} placeholder="PMP" />
      <Select value={String(tva)} onValueChange={(v) => recalc({ tva: v })}>
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
      <Select
        value={line.zone_id ?? "__none__"}
        onValueChange={(v) => onChange({ zone_id: v === "__none__" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Zone (optionnel)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Aucune</SelectItem>
          {zones.map((z) => (
            <SelectItem key={z.id} value={z.id}>
              {z.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

