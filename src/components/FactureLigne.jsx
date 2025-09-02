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
import {
  toNumberSafe,
  formatCurrencyEUR,
  formatQty,
  safeDiv,
  formatPercent,
} from '@/lib/numberFormat';
import { Badge } from '@/components/ui/badge';

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

  const round2 = (n) =>
    Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  const round3 = (n) =>
    Number.isFinite(n) ? Math.round(n * 1000) / 1000 : NaN;

  const [qteInput, setQteInput] = useState(
    line.quantite ? formatQty(round3(Number(line.quantite))) : ''
  );
  const [totalHtInput, setTotalHtInput] = useState(
    line.total_ht ? formatCurrencyEUR(round2(Number(line.total_ht))) : ''
  );

  useEffect(() => {
    setQteInput(
      line.quantite ? formatQty(round3(Number(line.quantite))) : ''
    );
  }, [line.quantite]);
  useEffect(() => {
    setTotalHtInput(
      line.total_ht ? formatCurrencyEUR(round2(Number(line.total_ht))) : ''
    );
  }, [line.total_ht]);

  const qte = round3(toNumberSafe(qteInput));
  const totalHT = round2(toNumberSafe(totalHtInput));
  const tva = Number(line.tva || 0);
  const puHT = safeDiv(totalHT, qte);
  const pmp = Number(line.pmp ?? 0);
  const variationPct = pmp > 0 ? ((puHT - pmp) / pmp) * 100 : 0;
  const varBadgeColor =
    variationPct < 0 ? 'green' : variationPct > 0 ? 'red' : 'gray';

  function update(nQte = qte, nTotalHT = totalHT, tv = tva) {
    const q = Number.isFinite(nQte) ? nQte : 0;
    const tht = Number.isFinite(nTotalHT) ? nTotalHT : 0;
    const pu = safeDiv(tht, q);
    const puRounded = round2(pu);
    const tva_montant = round2(tht * (Number(tv) / 100));
    const total_ttc = round2(tht + tva_montant);
    onChange({
      quantite: q,
      total_ht: tht,
      prix_total_ht: tht,
      pu_ht: puRounded,
      prix_unitaire_ht: puRounded,
      tva: tv,
      tva_montant,
      total_ttc,
    });
  }

  const linesArr = Array.isArray(allLines) ? allLines : [];
  const excludeIdsSameZone = [];
  for (const l of linesArr) {
    if (
      l.id !== line.id &&
      (l.zone_id ?? null) === (line.zone_id ?? null) &&
      l.produit_id
    ) {
      excludeIdsSameZone.push(l.produit_id);
    }
  }

  const TVA_OPTIONS = [0, 5.5, 10, 20];
  const tvaItems = [];
  for (const t of TVA_OPTIONS) {
    tvaItems.push(
      <SelectItem key={t} value={String(t)}>
        {t}%
      </SelectItem>
    );
  }

  const zoneItems = [];
  for (const z of Array.isArray(zones) ? zones : []) {
    zoneItems.push(
      <SelectItem key={z.id} value={z.id}>
        {z.nom}
      </SelectItem>
    );
  }

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
            update(qte, totalHT, tv);
          }}
          excludeIdsSameZone={excludeIdsSameZone}
          currentLineProductId={line.produit_id}
        />
      </div>
      <input
        type="text"
        inputMode="decimal"
        step="0.001"
        value={qteInput}
        onChange={(e) => {
          const v = e.target.value;
          setQteInput(v);
          const n = toNumberSafe(v);
          update(Number.isFinite(n) ? round3(n) : NaN, totalHT);
        }}
        onBlur={() => {
          const n = toNumberSafe(qteInput);
          const q = Number.isFinite(n) ? round3(n) : NaN;
          setQteInput(Number.isFinite(n) ? formatQty(q) : '');
        }}
        aria-label="Qté"
        className="input w-20 text-right"
        placeholder="0"
      />
      <Input readOnly disabled value={line.unite || ''} placeholder="Unité" />
      <input
        type="text"
        inputMode="decimal"
        step="0.01"
        value={totalHtInput}
        onChange={(e) => {
          const v = e.target.value;
          setTotalHtInput(v);
          const n = toNumberSafe(v);
          update(qte, Number.isFinite(n) ? round2(n) : NaN);
        }}
        onBlur={() => {
          const n = toNumberSafe(totalHtInput);
          const t = Number.isFinite(n) ? round2(n) : NaN;
          setTotalHtInput(Number.isFinite(n) ? formatCurrencyEUR(t) : '');
        }}
        aria-label="Total HT (€)"
        className="input w-28 text-right"
        placeholder="0,00 €"
      />
      <div className="flex items-center">
        <Input
          readOnly
          disabled
          value={Number.isFinite(puHT) ? formatCurrencyEUR(round2(puHT)) : ''}
          className="w-28 text-right opacity-60"
          placeholder="PU HT"
        />
        <Badge className="ml-2" color={varBadgeColor} ariaLabel="Écart vs PMP">
          {pmp > 0 ? formatPercent(variationPct) : '—'}
        </Badge>
      </div>
      <Input
        readOnly
        disabled
        value={formatCurrencyEUR(pmp)}
        placeholder="PMP"
      />
      <Select
        value={String(tva)}
        onValueChange={(v) => {
          const tv = Number(v);
          update(qte, totalHT, tv);
        }}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="TVA (%)" />
        </SelectTrigger>
          <SelectContent>{tvaItems}</SelectContent>
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
            {zoneItems}
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
