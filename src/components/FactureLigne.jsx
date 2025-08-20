import { useRef, useState } from "react";
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
import ProductPickerModal from "@/components/forms/ProductPickerModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMultiMama } from "@/context/MultiMamaContext";

function useZones() {
  const { currentMamaId } = useMultiMama();
  return useQuery({
    queryKey: ["zones_stock", currentMamaId],
    enabled: !!currentMamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones_stock")
        .select("id, nom")
        .eq("mama_id", currentMamaId)
        .eq("actif", true)
        .order("nom", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function FactureLigne({ value: line, onChange, onRemove, allLines = [], invalidProduit = false }) {
  const lineRef = useRef(null);
  const { data: zones = [] } = useZones();
  const [modalOpen, setModalOpen] = useState(false);

  const qte = Number(line?.quantite ?? line?.qte ?? 0);
  const totalHt = Number(line?.total_ht ?? line?.prix_total_ht ?? 0);
  const tva = Number(line?.tva ?? 0);
  const puHt = qte > 0 ? totalHt / qte : 0;

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
      qte: q,
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
      ? n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";

  const excludeIds = allLines.filter((l) => l.produit_id).map((l) => `'${l.produit_id}'`);

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
      <ProductPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        excludeIds={excludeIds}
        onSelect={(p) => {
          onChange({
            ...line,
            produit_id: p.id,
            produit_nom: p.nom,
            unite: p.unite ?? "",
            pmp: Number(p.pmp ?? 0),
            tva: Number(p.tva ?? 0),
          });
          setModalOpen(false);
        }}
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        value={qte}
        onChange={(e) => recalc({ quantite: e.target.value })}
        placeholder="Qté"
        autoComplete="off"
      />
      <Input readOnly disabled value={line.unite || ""} placeholder="Unité" />
      <Input
        type="number"
        min="0"
        step="0.01"
        value={totalHt.toFixed(2)}
        onChange={(e) => recalc({ total_ht: e.target.value })}
        placeholder="Total HT (€)"
        autoComplete="off"
      />
      <Input readOnly value={fmt(puHt)} placeholder="PU HT (€)" />
      <Input readOnly value={fmt(Number(line.pmp ?? 0))} placeholder="PMP" />
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

