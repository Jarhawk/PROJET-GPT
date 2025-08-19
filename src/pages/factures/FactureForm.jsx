// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FactureLigne from '@/components/FactureLigne';
import useFournisseurs from '@/hooks/data/useFournisseurs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useInvoice } from '@/hooks/useInvoice';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;

export function mapDbLineToUI(l) {
  const q = parseNum(l.quantite);
  const pu = parseNum(l.pu ?? l.prix_unitaire_ht ?? l.prix_unitaire);
  const montant = l.total_ht != null ? parseNum(l.total_ht) : q * pu;
  return {
    id: l.id,
    produit_id: l.produit_id,
    designation: l.produit?.nom ?? l.designation ?? '',
    quantite: String(q),
    prix_unitaire_ht: pu.toFixed(2),
    tva: l.tva ?? 0,
    montant_ht: montant.toFixed(2),
    pmp: l.pmp ?? 0,
  };
}

function createEmptyLine() {
  return {
    id: uuidv4(),
    produit_id: '',
    designation: '',
    quantite: '0',
    prix_unitaire_ht: '0',
    tva: '0',
    montant_ht: '0',
    pmp: 0,
  };
}

function FactureFormInner({
  facture,
  lignes: initialLignes,
  fournisseurs,
  onSaved,
  onClose,
}) {
  const methods = useForm({
    defaultValues: {
      fournisseur_id: facture?.fournisseur_id ?? '',
      date_facture:
        facture?.date_facture ?? new Date().toISOString().slice(0, 10),
      numero: facture?.numero ?? '',
      lignes: initialLignes.length ? initialLignes : [createEmptyLine()],
    },
  });
  const { control, handleSubmit, watch, formState } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' });

  const lignesWatch = watch('lignes');

  const totals = useMemo(() => {
    let ht = 0;
    let tva = 0;
    lignesWatch.forEach((l) => {
      const lineHt = parseNum(l.montant_ht);
      ht += lineHt;
      tva += lineHt * (parseNum(l.tva) / 100);
    });
    return { ht, tva, ttc: ht + tva };
  }, [lignesWatch]);

  const onSubmit = (values) => onSaved?.(values);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ENTÊTE */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Entête</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm">Fournisseur</label>
                <Select
                  {...methods.register('fournisseur_id')}
                  className="w-full"
                >
                  <option value="">Choisir...</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm">Numéro</label>
                <Input {...methods.register('numero')} />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Date</label>
                <Input type="date" {...methods.register('date_facture')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LIGNES */}
        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="text-lg font-semibold">Lignes</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex-1">Produit</div>
              <div className="w-24 text-right">Qté</div>
              <div className="w-24 text-right">Prix HT</div>
              <div className="w-24 text-right">TVA</div>
              <div className="w-32 text-right">Total HT</div>
              <div className="w-10" />
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <FactureLigne key={field.id} index={idx} onRemove={remove} />
              ))}
            </div>

            <Button
              type="button"
              onClick={() => append(createEmptyLine())}
              className="w-full"
            >
              Ajouter une ligne
            </Button>
          </CardContent>
        </Card>

        {/* TOTAUX + ACTIONS */}
        <Card>
          <CardContent>
            <div className="flex justify-end gap-8 text-sm">
              <div className="text-right">
                <div className="opacity-70">Total HT</div>
                <div className="font-semibold">{totals.ht.toFixed(2)} €</div>
              </div>
              <div className="text-right">
                <div className="opacity-70">TVA</div>
                <div className="font-semibold">{totals.tva.toFixed(2)} €</div>
              </div>
              <div className="text-right">
                <div className="opacity-70">Total TTC</div>
                <div className="font-semibold">{totals.ttc.toFixed(2)} €</div>
              </div>
            </div>
          </CardContent>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/10 bg-black/40 p-4">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={formState.isSubmitting}>
              Enregistrer
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}

export default function FactureForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { session } = useAuth();
  const mamaId = (
    session?.user?.user_metadata?.mama_id ??
    session?.user?.mama_id ??
    ''
  ).toString();
  const isNew = !id || id === 'new';

  const { data: invoice, isLoading } = useInvoice(isNew ? undefined : id);
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true });

  const initialFacture = invoice
    ? {
        id: invoice.id,
        numero: invoice.numero ?? '',
        date_facture: (invoice.date_facture ?? '').slice(0, 10),
        fournisseur_id: invoice.fournisseur_id ?? '',
      }
    : null;

  const initialLignes = useMemo(
    () => (invoice?.lignes ?? []).map(mapDbLineToUI),
    [invoice]
  );

  const handleSave = async (values) => {
    const { fournisseur_id, date_facture, numero, lignes } = values;
    try {
      const payload = {
        facture: { id: invoice?.id, numero, date_facture, fournisseur_id },
        lignes: (lignes || []).map((l) => ({
          id: l.id,
          produit_id: l.produit_id,
          quantite: parseNum(l.quantite),
          pu_ht: parseNum(l.prix_unitaire_ht),
          tva: parseNum(l.tva),
        })),
      };
      const { error } = await supabase.rpc('fn_facture_save', {
        p_mama_id: mamaId,
        p_payload: payload,
      });
      if (error) throw error;
      toast.success('Facture enregistrée');
      navigate('/factures');
    } catch (e) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <FactureFormInner
      facture={initialFacture}
      lignes={initialLignes}
      fournisseurs={fournisseurs}
      onSaved={handleSave}
      onClose={() => navigate(-1)}
    />
  );
}
