// src/pages/factures/FactureForm.jsx
import { useMemo, useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import FactureLigne from '@/components/FactureLigne';
import SupplierPicker from '@/components/factures/SupplierPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mapUILineToPayload } from '@/features/factures/invoiceMappers';
import useProduitLineDefaults from '@/hooks/useProduitLineDefaults';
import useZonesStock from '@/hooks/useZonesStock';
import { formatMoneyFR, formatMoneyFromCents } from '@/utils/numberFormat';
import { toNumberSafeFR, formatCurrencyEUR } from '@/utils/numberFR.js';


const today = () => format(new Date(), 'yyyy-MM-dd');

export default function FactureForm({ facture = null, onSaved } = {}) {
  const { mama_id: mamaId } = useAuth();
  const { fetchDefaults } = useProduitLineDefaults();

  const emptyLigne = () => ({
    id: crypto.randomUUID(),
    produit_id: null,
    produit_nom: '',
    unite_id: null,
    quantite: 1,
    unite: '',
    total_ht: 0,
    prix_total_ht: 0,
    pu_ht: 0,
    prix_unitaire_ht: 0,
    pmp: 0,
    tva: 0,
    tva_montant: 0,
    total_ttc: 0,
    zone_id: null,
  });

  const emptyForm = () => ({
    id: null,
    fournisseur_id: null,
    date_facture: today(),
    numero: '',
    statut: 'Brouillon',
    total_ht_attendu: null,
    lignes: [emptyLigne()],
  });

  const form = useForm({
    defaultValues: facture
      ? { ...emptyForm(), ...facture, fournisseur_id: facture.fournisseur_id }
      : emptyForm(),
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState,
    register,
  } = form;
  const { errors, submitCount } = formState;
  const [saving, setSaving] = useState(false);
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lignes',
  });
  const lignes = watch('lignes');
  const lignesArr = useMemo(
    () => (Array.isArray(lignes) ? lignes : []),
    [lignes]
  );
  const { data: zones = [], isSuccess } = useZonesStock();
  const totalHTAttendu = watch('total_ht_attendu');
  const statut = watch('statut');
  const formId = watch('id');
  const fournisseur_id = watch('fournisseur_id');
  const setFournisseurId = (val) =>
    setValue('fournisseur_id', val, { shouldDirty: true });

  const sum = (arr) => arr.reduce((acc, n) => acc + n, 0);

  const sumHTCents = useMemo(() => {
    const values = [];
    for (const l of lignesArr) {
      values.push(Math.round(Number(l.total_ht || 0) * 100));
    }
    return sum(values);
  }, [lignesArr]);
  const sommeLignesHT = sumHTCents / 100;
  const sumTVACents = useMemo(() => {
    const values = [];
    for (const l of lignesArr) {
      values.push(Math.round(Number(l.tva_montant || 0) * 100));
    }
    return sum(values);
  }, [lignesArr]);
  const sumTTCents = useMemo(() => {
    const values = [];
    for (const l of lignesArr) {
      values.push(Math.round(Number(l.total_ttc || 0) * 100));
    }
    return sum(values);
  }, [lignesArr]);

  const round2 = (n) =>
    Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  const [totalAttenduInput, setTotalAttenduInput] = useState(
    totalHTAttendu ? formatCurrencyEUR(round2(totalHTAttendu)) : ''
  );
  useEffect(() => {
    setTotalAttenduInput(
    totalHTAttendu ? formatCurrencyEUR(round2(totalHTAttendu)) : ''
    );
  }, [totalHTAttendu]);

  const ecart_ht = useMemo(() => {
    const expected = Number(totalHTAttendu ?? 0);
    return +(expected - sommeLignesHT).toFixed(2);
  }, [totalHTAttendu, sommeLignesHT]);

  useEffect(() => {
    register('total_ht_attendu');
  }, [register]);

  useEffect(() => {
    if (ecart_ht !== 0 && statut === 'Validée') {
      setValue('statut', 'Brouillon');
    }
  }, [ecart_ht, statut, setValue]);

  const addLigne = () => append(emptyLigne());

  const updateLigne = async (i, patch) => {
    let merged = { ...lignesArr[i], ...patch };
    if (patch.produit_id) {
      try {
        const defaults = await fetchDefaults({ produit_id: patch.produit_id });
        const q = Number(merged.quantite || 0);
        const lht = Number(merged.total_ht || 0);
        const tv = Number(merged.tva ?? 0);
        const pu = q > 0 ? +(lht / q).toFixed(4) : 0;
        const tvaMontant = +(lht * (tv / 100)).toFixed(2);
        const totalTtc = +(lht + tvaMontant).toFixed(2);
        merged = {
          ...merged,
          unite_id: defaults.unite_id,
          unite: defaults.unite,
          pmp: defaults.pmp,
          tva: tv,
          pu_ht: pu,
          prix_unitaire_ht: pu,
          tva_montant: tvaMontant,
          total_ttc: totalTtc,
          prix_total_ht: lht,
        };
      } catch (e) {
        console.warn('[FactureForm] defaults fetch failed', e);
      }
    }
    update(i, merged);
  };

  useEffect(() => {
    const arr = Array.isArray(lignes) ? lignes : [];
    for (let i = 0; i < arr.length; i++) {
      const l = arr[i];
      if (!l.zone_id && isSuccess && zones.length === 1) {
        updateLigne(i, { zone_id: zones[0].id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, zones, lignes]);

  const onSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    try {
      if (!mamaId) {
        toast.error('Organisation introuvable.');
        return;
      }
      if (!values.fournisseur_id) {
        toast.error('Sélectionnez un fournisseur.');
        setError('fournisseur_id', { type: 'required' });
        return;
      }
      const payloadLignes = [];
      for (const l of lignesArr) {
        if (l.produit_id) payloadLignes.push(mapUILineToPayload(l));
      }
      if (payloadLignes.length === 0) {
        toast.error('Ajoutez au moins une ligne produit.');
        for (let i = 0; i < lignesArr.length; i++) {
          if (!lignesArr[i]?.produit_id)
            setError(`lignes.${i}.produit_id`, { type: 'required' });
        }
        return;
      }

      const payload = {
        facture: {
          id: formId || undefined,
          fournisseur_id: values.fournisseur_id,
          numero: values.numero || null,
          date_facture: values.date_facture,
          etat: values.statut,
        },
        lignes: payloadLignes,
      };

      const { data, error } = await supabase.rpc('fn_save_facture', {
        mama_id: mamaId,
        facture: payload.facture,
        lignes: payload.lignes,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(
        `Facture enregistrée • N° ${values.numero || '—'} • ${values.statut}`
      );

      onSaved?.();
      if (!formId) reset(emptyForm());
      return data;
    } catch (e) {
      console.warn(e);
      toast.error(
        e?.message || "Erreur lors de l'enregistrement de la facture"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ENTÊTE */}
      <div className="rounded-xl border border-border bg-card p-4 grid gap-4 md:grid-cols-5 grid-cols-1">
        {/* Fournisseur */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fournisseur</label>
          <SupplierPicker
            value={fournisseur_id}
            onChange={setFournisseurId}
            error={errors.fournisseur_id}
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Date</label>
          <Controller
            control={control}
            name="date_facture"
            render={({ field }) => <Input type="date" {...field} />}
          />
        </div>

        {/* Numéro */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Numéro</label>
          <Controller
            control={control}
            name="numero"
            render={({ field }) => (
              <Input placeholder="N° facture" {...field} />
            )}
          />
        </div>

        {/* Statut */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Statut</label>
          <Controller
            control={control}
            name="statut"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  {ecart_ht === 0 && (
                    <SelectItem value="Validée">Validée</SelectItem>
                  )}
                  <SelectItem value="Annulée">Annulée</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Total HT attendu */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Total HT attendu (€)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              step="0.01"
              value={totalAttenduInput}
              onChange={(e) => setTotalAttenduInput(e.target.value)}
              onBlur={() => {
                const n = toNumberSafeFR(totalAttenduInput);
                const t = Number.isFinite(n) ? round2(n) : NaN;
                setTotalAttenduInput(
                  Number.isFinite(n) ? formatCurrencyEUR(t) : ''
                );
                setValue('total_ht_attendu', Number.isFinite(n) ? t : null, {
                  shouldDirty: true,
                });
              }}
              className="bg-white text-gray-900 placeholder-gray-500 rounded-md h-9 px-3 w-36 text-right border border-gray-300"
              placeholder="0,00 €"
            />
            <Badge
              color={
                ecart_ht === 0
                  ? 'green'
                  : Math.abs(ecart_ht) < 0.01
                    ? 'gold'
                    : 'red'
              }
              ariaLabel="Écart HT"
            >
              {`Écart ${formatMoneyFR(ecart_ht)}`}
            </Badge>
          </div>
        </div>
      </div>

      {/* LIGNES */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Lignes produits
          </h3>
          <Button type="button" variant="secondary" onClick={addLigne}>
            + Ajouter une ligne
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-4 lignes-produits">
          {/* En-têtes colonnes */}
          <div className="grid gap-3 text-xs text-muted-foreground px-1 grid-cols-[repeat(auto-fit,minmax(140px,1fr))] xl:grid-cols-[minmax(260px,1fr)_90px_110px_140px_140px_110px_110px_180px_60px]">
            <div>Produit</div>
            <div>Qté</div>
            <div>Unité</div>
            <div>Total HT (€)</div>
            <div>PU HT (€)</div>
            <div>PMP</div>
            <div>TVA %</div>
            <div>Zone</div>
            <div>Actions</div>
          </div>

          {(() => {
            const items = [];
            if (Array.isArray(fields)) {
              for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                items.push(
                  <FactureLigne
                    key={f.id}
                    value={lignesArr[i]}
                    onChange={(patch) => updateLigne(i, patch)}
                    onRemove={() => remove(i)}
                    allLines={lignesArr}
                    invalidProduit={submitCount > 0 && !lignesArr[i]?.produit_id}
                    index={i}
                    zones={zones}
                  />
                );
              }
            }
            return items;
          })()}
        </div>
      </section>

      {/* TOTAUX */}
      <div className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total HT</span>
          <span className="font-semibold">{formatMoneyFromCents(sumHTCents)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">TVA €</span>
          <span className="font-semibold">{formatMoneyFromCents(sumTVACents)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total TTC</span>
          <span className="font-semibold">{formatMoneyFromCents(sumTTCents)}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <div className="flex flex-col items-end">
          <Button
            type="submit"
            disabled={saving || (statut === 'Validée' && ecart_ht !== 0)}
            title={
              statut === 'Validée' && ecart_ht !== 0
                ? 'Écart non nul : la facture ne peut être validée.'
                : undefined
            }
          >
            Enregistrer
          </Button>
        </div>
      </div>

    </form>
  );
}
