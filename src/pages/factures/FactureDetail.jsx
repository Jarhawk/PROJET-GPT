// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import FactureForm from './FactureForm.jsx';
import { mapDbLineToUI } from '@/features/factures/invoiceMappers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

function toLabel(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return toLabel(v[0]);
  if (typeof v === 'object') return (
    v.nom ??
    v.name ??
    v.label ??
    v.code ??
    v.abbr ??
    v.abreviation ??
    v.symbol ??
    v.symbole ??
    v.id ??
    ''
  ) + '';
  return String(v);
}

export default function FactureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('factures')
        .select(
          `id, mama_id, fournisseur_id, numero, date_facture, actif, total_ht, total_ttc, tva,
          lignes:facture_lignes(
            id, produit_id, quantite, prix_unitaire_ht, montant_ht, tva, zone_id,
            produit:produits(id, nom, unite, pmp, tva)
          )`
        )
        .eq('id', id)
        .single();

      if (error) {
        toast.error(error.message || 'Erreur de chargement de la facture');
      } else if (data && isMounted) {
        setForm({
          id: data.id,
          fournisseur_id: data.fournisseur_id ?? null,
          date_facture: data.date_facture,
          numero: data.numero ?? '',
          statut: data.actif ? 'Validée' : 'Brouillon',
          total_ht_attendu: Number(data.total_ht ?? 0) || null,
        });
        setLignes((data.lignes || []).map(mapDbLineToUI));
      }

      if (isMounted) setLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <FactureForm
      initialForm={form}
      initialLignes={lignes}
      onClose={() => navigate(-1)}
      onSaved={() => navigate(-1)}
    />
  );
}

export { toLabel };

