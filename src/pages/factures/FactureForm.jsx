// src/pages/factures/FactureForm.jsx
import { useMemo, useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useZones } from '@/hooks/useZones';
import FactureLigne from '@/components/FactureLigne';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function FactureForm({ facture = null, onSaved } = {}) {
  const { profile } = useAuth();
  const mamaId = profile?.mama_id || null;

  // Fournisseurs
  const { data: fournisseursData } = useQuery({
    queryKey: ['fournisseurs', mamaId],
    enabled: !!mamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('mama_id', mamaId)
        .eq('actif', true)
        .order('nom', { ascending: true })
        .limit(50);
      if (error) throw error;
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });
  const fournisseurs = Array.isArray(fournisseursData)
    ? fournisseursData
    : (fournisseursData?.data ?? []);

  // Zones (liste globale, préremplie ligne par ligne si default_zone_id arrive du produit)
  const { zones, fetchZones } = useZones();
  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const emptyLigne = () => ({
    id: crypto.randomUUID(),
    produit_id: null,
    produit_nom: '',
    quantite: 1,
    unite: '',
    prix_total_ht: 0,
    pmp: 0,
    tva: 0,
    zone_id: '',
  });

  const emptyForm = () => ({
    fournisseur_id: '',
    date_facture: today(),
    numero: '',
    statut: 'Brouillon', // mappe vers p_actif
    total_ht_attendu: null,
    lignes: [emptyLigne()],
  });

  const form = useForm({
    defaultValues: emptyForm(),
  });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const { control, handleSubmit, watch, reset, setValue } = form;
  const [saving, setSaving] = useState(false);
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lignes',
  });
  const lignes = watch('lignes');
  const totalHTAttendu = watch('total_ht_attendu');
  const statut = watch('statut');
  const excludeIds = useMemo(
    () => (lignes || []).map((l) => l.produit_id).filter(Boolean),
    [lignes]
  );

  const sommeLignesHT = useMemo(() => {
    let sum = 0;
    for (const l of lignes || []) {
      sum += Number(l.total_ht ?? l.prix_total_ht ?? 0);
    }
    return +sum.toFixed(2);
  }, [lignes]);

  const ecart_ht = useMemo(() => {
    const expected = Number(totalHTAttendu ?? 0);
    return +(expected - sommeLignesHT).toFixed(2);
  }, [totalHTAttendu, sommeLignesHT]);

  useEffect(() => {
    if (ecart_ht !== 0 && statut === 'Validée') {
      setValue('statut', 'Brouillon');
    }
  }, [ecart_ht, statut, setValue]);

  const sum = (arr) => arr.reduce((acc, n) => acc + n, 0);

  const totalHT = useMemo(
    () =>
      Number(
        sum(
          lignes.map((l) => Number(l.total_ht ?? l.prix_total_ht ?? 0))
        ).toFixed(2)
      ),
    [lignes]
  );

  const totalTVA_EUR = useMemo(
    () =>
      Number(
        sum(
          lignes.map(
            (l) =>
              (Number(l.total_ht ?? l.prix_total_ht ?? 0) *
                Number(l.tva || 0)) /
              100
          )
        ).toFixed(2)
      ),
    [lignes]
  );

  const totalTTC = useMemo(
    () => Number((totalHT + totalTVA_EUR).toFixed(2)),
    [totalHT, totalTVA_EUR]
  );

  const addLigne = () =>
    append({
      id: crypto.randomUUID(),
      produit_id: null,
      produit_nom: '',
      quantite: 1,
      unite: '',
      prix_total_ht: 0,
      pmp: 0,
      tva: 0,
      zone_id: '',
    });

  const updateLigne = (i, patch) => update(i, { ...lignes[i], ...patch });

  const buildPayload = (lgs = []) =>
    (lgs || [])
      .filter((l) => l.produit_id && Number(l.quantite) > 0)
      .map(({ produit_id, quantite, prix_unitaire_ht, tva, zone_id }) => ({
        produit_id,
        quantite: Number(quantite || 0),
        prix_unitaire_ht: Number(prix_unitaire_ht || 0),
        tva: Number(tva || 0),
        zone_id: zone_id ?? null,
      }));

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
        return;
      }

      const payloadLignes = buildPayload(values.lignes);
      if (payloadLignes.length === 0) {
        toast.error('Ajoutez au moins une ligne produit.');
        return;
      }

      const p_actif = values.statut === 'Validée' && ecart_ht === 0;

      const { data, error } = await supabase.rpc('fn_save_facture', {
        p_mama_id: mamaId,
        p_fournisseur_id: values.fournisseur_id,
        p_numero: values.numero || null,
        p_date: values.date_facture,
        p_lignes: payloadLignes,
        p_actif,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(
        `Facture enregistrée • N° ${values.numero || '—'} • ${values.statut}`
      );

      onSaved?.();
      if (!facture) reset(emptyForm());
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
          <Controller
            control={control}
            name="fournisseur_id"
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v)}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {fournisseurs.find((f) => f.id === field.value)?.nom ||
                      'Sélectionner'}
                  </span>
                </SelectTrigger>
                <SelectContent align="start" className="max-h-64 overflow-auto">
                  {fournisseurs.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                  <span className="truncate">{field.value || 'Statut'}</span>
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
              mamaId={mamaId}
              excludeIds={excludeIds}
              zones={zones}
            />
          ))}
        </div>
      </section>

      {/* TOTAUX */}
      <div className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total HT</span>
          <span className="font-semibold">{formatter.format(totalHT)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">TVA €</span>
          <span className="font-semibold">
            {formatter.format(totalTVA_EUR)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total TTC</span>
          <span className="font-semibold">{formatter.format(totalTTC)}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
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
    </form>
  );
}
