// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useInvoice } from '@/hooks/useInvoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function mapDbLineToUI(l) {
  const q = parseFloat(l.quantite) || 0;
  const pu = parseFloat(l.pu ?? l.prix_unitaire) || 0;
  return {
    id: l.id,
    produit: l.produit ?? { id: l.produit_id },
    produit_id: l.produit_id,
    quantite: String(q),
    unite: l.unite ?? l.produit?.unite_achat ?? l.produit?.unite ?? '',
    total_ht: l.total_ht != null ? String(l.total_ht) : (q * pu).toFixed(2),
    pu: pu.toFixed(2),
    pmp: l.pmp ?? l.produit?.pmp ?? 0,
    tva: l.tva ?? l.produit?.tva_id ?? null,
    zone_id: l.zone_id ?? l.produit?.zone_stock_id ?? '',
    position: l.position ?? 0,
    note: l.note ?? '',
    actif: l.actif ?? true,
    manuallyEdited: false,
  };
}

export default function FactureForm({ onSaved, onClose }) {
  const { id } = useParams();

  const form = useForm({
    defaultValues: {
      numero: '',
      date_facture: new Date().toISOString().slice(0, 10),
      fournisseur_id: null,
      lignes: [],
    },
  });

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useInvoice(id);

  const mapped = useMemo(() => {
    if (!invoice) return null;
    return {
      numero: invoice.numero ?? '',
      date_facture: (invoice.date_facture ?? '').slice(0, 10),
      fournisseur_id: invoice.fournisseur_id ?? null,
      lignes: (invoice.lignes ?? []).map((l) => ({
        id: l.id,
        produit_id: l.produit_id,
        produit_nom: l.produit?.nom ?? '',
        quantite: Number(l.quantite ?? 0),
        prix_unitaire: Number(l.prix_unitaire ?? 0),
        tva: Number(l.tva ?? 0),
        remise: Number(l.remise ?? 0),
        total_ht: Number(l.total_ht ?? 0),
        total_ttc: Number(l.total_ttc ?? 0),
      })),
    };
  }, [invoice]);

  useEffect(() => {
    if (mapped && id !== 'new') {
      form.reset(mapped);
    }
  }, [mapped, id, form]);

  const handleSave = () => {
    const values = form.getValues();
    onSaved?.(values);
  };

  if (id !== 'new' && isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Erreur lors du chargement de la facture.</p>
        <Button onClick={() => refetch()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
      <Input placeholder="Numéro" {...form.register('numero')} />
      <Input type="date" {...form.register('date_facture')} />
      <Input placeholder="Fournisseur" {...form.register('fournisseur_id')} />
      <div className="flex gap-2">
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
        )}
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

