// src/pages/factures/FactureForm.jsx
import { useMemo, useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import supabase from '@/lib/supabaseClient';
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

const FN_UPDATE_FACTURE_EXISTS = false;

const today = () => format(new Date(), 'yyyy-MM-dd');
const fmt2 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
    statut: 'Brouillon', // mappe vers p_actif
    total_ht_attendu: null,
    lignes: [emptyLigne()],
  });

  const form = useForm({
    defaultValues: facture
      ? { ...emptyForm(), ...facture, fournisseur_id: facture.fournisseur_id }
      : emptyForm(),
  });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const { control, handleSubmit, watch, reset, setValue, setError, formState } = form;
  const { errors, submitCount } = formState;
  const [saving, setSaving] = useState(false);
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lignes',
  });
  const lignes = watch('lignes');
  const totalHTAttendu = watch('total_ht_attendu');
  const statut = watch('statut');
  const formId = watch('id');
  const fournisseur_id = watch('fournisseur_id');
  const setFournisseurId = (val) =>
    setValue('fournisseur_id', val, { shouldDirty: true });

  const sum = (arr) => arr.reduce((acc, n) => acc + n, 0);
  const eur = (n) =>
    Number.isFinite(+n)
      ? (+n).toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        })
      : '0,00 €';

  const sumHT = useMemo(
    () => sum(lignes.map((l) => Number(l.total_ht || 0))),
    [lignes]
  );
  const sommeLignesHT = sumHT;
  const sumTVA = useMemo(
    () => sum(lignes.map((l) => Number(l.tva_montant || 0))),
    [lignes]
  );
  const sumTTC = useMemo(
    () => sum(lignes.map((l) => Number(l.total_ttc || 0))),
    [lignes]
  );

  const ecart_ht = useMemo(() => {
    const expected = Number(totalHTAttendu ?? 0);
    return +(expected - sommeLignesHT).toFixed(2);
  }, [totalHTAttendu, sommeLignesHT]);

  useEffect(() => {
    if (ecart_ht !== 0 && statut === 'Validée') {
      setValue('statut', 'Brouillon');
    }
  }, [ecart_ht, statut, setValue]);

  const addLigne = () => append(emptyLigne());

  const updateLigne = async (i, patch) => {
    let merged = { ...lignes[i], ...patch };
    if (patch.produit_id) {
      try {
        const defaults = await fetchDefaults({ produit_id: patch.produit_id });
        const q = Number(merged.quantite || 0);
        const lht = Number(merged.total_ht || 0);
        const tv = Number(defaults.tva || 0);
        const pu = q > 0 ? +(lht / q).toFixed(4) : 0;
        const tvaMontant = +(lht * (tv / 100)).toFixed(2);
        const totalTtc = +(lht + tvaMontant).toFixed(2);
        merged = {
          ...merged,
          unite_id: defaults.unite_id,
          unite: defaults.unite,
          pmp: defaults.pmp,
          tva: tv,
          zone_id: defaults.zone_id,
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
      const payloadLignes = (lignes || [])
        .filter((l) => l.produit_id)
        .map(mapUILineToPayload);
      if (payloadLignes.length === 0) {
        toast.error('Ajoutez au moins une ligne produit.');
        (lignes || []).forEach((l, i) => {
          if (!l.produit_id) setError(`lignes.${i}.produit_id`, { type: 'required' });
        });
        return;
      }

      const p_actif = values.statut === 'Validée' && ecart_ht === 0;

      if (formId && !FN_UPDATE_FACTURE_EXISTS) {
        toast.error(
          'La modification nécessite fn_update_facture côté serveur'
        );
        return;
      }

      const rpcName = formId ? 'fn_update_facture' : 'fn_save_facture';
      const args = formId
        ? {
            p_facture_id: formId,
            p_mama_id: mamaId,
            p_fournisseur_id: values.fournisseur_id,
            p_numero: values.numero || null,
            p_date: values.date_facture,
            p_lignes: payloadLignes,
            p_actif,
          }
        : {
            p_mama_id: mamaId,
            p_fournisseur_id: values.fournisseur_id,
            p_numero: values.numero || null,
            p_date: values.date_facture,
            p_lignes: payloadLignes,
            p_actif,
          };

      const { data, error } = await supabase.rpc(rpcName, args);

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

        {/* Statut (mappe p_actif) */}
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
          <Controller
            control={control}
            name="total_ht_attendu"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={
                    field.value === null ||
                    field.value === undefined ||
                    Number.isNaN(field.value)
                      ? ''
                      : formatter.format(field.value)
                  }
                  onChange={(e) => {
                    const raw = e.target.value
                      .replace(/\s/g, '')
                      .replace(',', '.');
                    const num = parseFloat(raw);
                    field.onChange(Number.isNaN(num) ? null : num);
                  }}
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
                  {`Écart ${formatter.format(ecart_ht)}`}
                </Badge>
              </div>
            )}
          />
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

          {fields.map((f, i) => (
            <FactureLigne
              key={f.id}
              value={lignes[i]}
              onChange={(patch) => updateLigne(i, patch)}
              onRemove={() => remove(i)}
              allLines={lignes}
              invalidProduit={submitCount > 0 && !lignes[i]?.produit_id}
            />
          ))}
        </div>
      </section>

      {/* TOTAUX */}
      <div className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total HT</span>
          <span className="font-semibold">{fmt2.format(sumHT)} €</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">TVA €</span>
          <span className="font-semibold">{fmt2.format(sumTVA)} €</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total TTC</span>
          <span className="font-semibold">{fmt2.format(sumTTC)} €</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <div className="flex flex-col items-end">
          <Button
            type="submit"
            disabled={
              saving ||
              (statut === 'Validée' && ecart_ht !== 0) ||
              (formId && !FN_UPDATE_FACTURE_EXISTS)
            }
            title={
              statut === 'Validée' && ecart_ht !== 0
                ? 'Écart non nul : la facture ne peut être validée.'
                : undefined
            }
          >
            Enregistrer
          </Button>
          {formId && !FN_UPDATE_FACTURE_EXISTS && (
            <p className="text-sm text-destructive mt-2">
              La modification nécessite fn_update_facture côté serveur
            </p>
          )}
        </div>
      </div>

    </form>
  );
}
