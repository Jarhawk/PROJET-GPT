import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import ProduitSearchModal from '@/components/factures/ProduitSearchModal';
import MoneyInput from '@/components/inputs/MoneyInput';
import QtyInput from '@/components/inputs/QtyInput';
import { formatMoneyFromCents } from '@/utils/numberFormat';

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

  const [qty, setQty] = useState(Number(line.quantite || 0));
  const [totalCents, setTotalCents] = useState(
    Math.round(Number(line.total_ht || 0) * 100)
  );

  useEffect(() => {
    setQty(Number(line.quantite || 0));
  }, [line.quantite]);
  useEffect(() => {
    setTotalCents(Math.round(Number(line.total_ht || 0) * 100));
  }, [line.total_ht]);

  const tva = Number(line.tva || 0);
  const puCents = qty > 0 ? Math.round(totalCents / qty) : 0;
  const pmpCents = Math.round(Number(line.pmp ?? 0) * 100);
  const variationPct =
    pmpCents > 0 ? ((puCents - pmpCents) / pmpCents) * 100 : 0;
  const varColor =
    variationPct < 0
      ? 'text-emerald-400'
      : variationPct > 0
      ? 'text-red-400'
      : 'text-neutral-400';

  function update(nQty = qty, nTotalCents = totalCents, tv = tva) {
    const pu = nQty > 0 ? Math.round(nTotalCents / nQty) : 0;
    const total_ht = nTotalCents / 100;
    const pu_ht = pu / 100;
    const tva_montant = +(total_ht * (Number(tv) / 100)).toFixed(2);
    const total_ttc = +(total_ht + tva_montant).toFixed(2);
    onChange({
      quantite: nQty,
      total_ht,
      prix_total_ht: total_ht,
      pu_ht,
      prix_unitaire_ht: pu_ht,
      tva: tv,
      tva_montant,
      total_ttc,
    });
  }

  const excludeIdsSameZone = allLines
    .filter(
      (l) =>
        l.id !== line.id && (l.zone_id ?? null) === (line.zone_id ?? null) && !!l.produit_id
    )
    .map((l) => l.produit_id);

  const TVA_OPTIONS = [0, 5.5, 10, 20];

  function openProductPicker() {
    setModalOpen(true);
  }

  return (
    <div
      ref={lineRef}
      tabIndex={-1}
      className="grid gap-3 items-center grid-cols-[repeat(auto-fit,minmax(140px,1fr))] xl:grid-cols-[minmax(260px,1fr)_90px_110px_140px_140px_110px_110px_180px_60px]"
    >
      <div>
        <div
          className={`input w-full cursor-pointer ${invalidProduit ? 'border-destructive' : ''}`}
          role="button"
          tabIndex={0}
          onClick={openProductPicker}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && openProductPicker()
          }
          aria-label="Choisir un produit"
        >
          {line.produit_nom || 'Choisir un produit'}
        </div>
        <ProduitSearchModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSelect={(p) => {
            const tv = p.tva ?? 0;
            onChange({
              produit_id: p.produit_id,
              produit_nom: p.nom,
              unite_id: p.unite_id ?? null,
              tva: tv,
              zone_id: p.zone_id ?? line.zone_id ?? null,
              pmp: p.pmp ?? null,
              unite: p.unite ?? line.unite ?? '',
            });
            update(qty, totalCents, tv);
          }}
          excludeIdsSameZone={excludeIdsSameZone}
          currentLineProductId={line.produit_id}
        />
      </div>
      <QtyInput
        value={qty}
        onChange={(n) => {
          const v = n ?? 0;
          setQty(v);
          update(v, totalCents);
        }}
        aria-label="Qté"
        className="w-20"
      />
      <Input readOnly disabled value={line.unite || ''} placeholder="Unité" />
      <MoneyInput
        valueCents={totalCents}
        onChangeCents={(c) => {
          const v = c ?? 0;
          setTotalCents(v);
          update(qty, v);
        }}
        aria-label="Total HT (€)"
        className="w-28"
        placeholder="0,00 €"
      />
      <div className="flex items-center">
        <div
          className="input w-28 pointer-events-none select-none opacity-50"
          aria-readonly="true"
          tabIndex={-1}
          role="textbox"
          aria-label="PU HT (€) calculé"
          title="PU HT = Total HT / Qté"
        >
          {formatMoneyFromCents(puCents)}
        </div>
        <div className={`ml-2 text-xs ${varColor}`} title="Écart vs PMP">
          {pmpCents > 0 ? `${variationPct.toFixed(2).replace('.', ',')}%` : '—'}
        </div>
      </div>
      <Input
        readOnly
        disabled
        value={formatMoneyFromCents(pmpCents)}
        placeholder="PMP"
      />
      <Select
        value={String(tva)}
        onValueChange={(v) => {
          const tv = Number(v);
          update(qty, totalCents, tv);
        }}
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
      <Select
        value={line.zone_id ?? '__none__'}
        onValueChange={(v) => onChange({ zone_id: v === '__none__' ? null : v })}
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
