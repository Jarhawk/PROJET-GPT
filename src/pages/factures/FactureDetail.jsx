// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import FactureForm, { mapDbLineToUI } from './FactureForm.jsx';
import { useFournisseurs } from '@/hooks/useFournisseurs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

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

async function tableExists(name) {
  try {
    const { error } = await supabase.from(name).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default function FactureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fournisseurs, getFournisseurs } = useFournisseurs();
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({ header: null, lignes: [] });

  useEffect(() => {
    getFournisseurs();
  }, [getFournisseurs]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const tableLines = (await tableExists('facture_lignes'))
          ? 'facture_lignes'
          : 'lignes_facture';

        const [headerRes, linesRes] = await Promise.all([
          supabase
            .from('factures')
            .select(
              'id, numero, date_facture, fournisseur_id, zone_id, tva_mode, actif, created_at, updated_at'
            )
            .eq('id', id)
            .single(),
          supabase
            .from(tableLines)
            .select(
              `id, facture_id, produit_id, quantite, unite, total_ht, pu, pmp, tva, zone_id, position, note, actif,
            produit:produits(id, nom, code, ref_fournisseur, unite_achat, unite, tva_id, zone_stock_id)`
            )
            .eq('facture_id', id)
            .order('position', { ascending: true })
        ]);

        const { data: header, error: e1 } = headerRes;
        const { data: lines, error: e2 } = linesRes;

        if (e1 || e2) {
          toast.error('Erreur de chargement de la facture');
          return;
        }

        if (isMounted) {
          setFormState({
            header,
            lignes: (lines ?? []).map(mapDbLineToUI),
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Erreur de chargement de la facture');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <FactureForm
      facture={formState.header}
      lignes={formState.lignes}
      fournisseurs={fournisseurs}
      onClose={() => navigate(-1)}
      onSaved={() => navigate(-1)}
    />
  );
}

export { toLabel };

