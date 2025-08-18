// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

type Ligne = {
  id?: string;
  produit_id: string;
  quantite: number;
  pu_ht: number;
  tva?: number; // %
};

type FacturePayload = {
  facture: {
    id?: string;
    numero: string;
    date_facture: string; // 'YYYY-MM-DD'
    fournisseur_id: string;
    etat?: string; // 'Brouillon' | 'Validée'...
  };
  lignes: Ligne[];
  apply_stock?: boolean;
};

export function useSaveFacture(mama_id: string) {
  const supabase = useSupabaseClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FacturePayload) => {
      const { data, error } = await supabase.rpc('fn_facture_save', {
        p_mama_id: mama_id,
        p_payload: payload,
        p_apply_stock: payload.apply_stock ?? false,
      });

      if (error) throw error;
      return data as any; // { facture: {...}, lignes: [...] }
    },
    onMutate: () => {
      toast.loading('Enregistrement de la facture…', { id: 'facture-save' });
    },
    onSuccess: (data) => {
      toast.success('Facture enregistrée', { id: 'facture-save' });
      // invalider les listes liées
      qc.invalidateQueries({ queryKey: ['factures', mama_id] });
      if (data?.facture?.id) {
        qc.setQueryData(['facture', data.facture.id], data);
      }
    },
    onError: (err: any) => {
      toast.error(`Erreur d'enregistrement : ${err.message ?? err}`, { id: 'facture-save' });
      console.error('[facture-save] error', err);
    },
  });
}

export function useFacture(factureId?: string) {
  const supabase = useSupabaseClient();
  return {
    fetchOne: async (id: string) => {
      const { data, error } = await supabase
        .from('factures')
        .select(
          '*, lignes:facture_lignes(*, produit:produit_id(id, nom)), fournisseur:fournisseur_id(id, nom)'
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  };
}

async function detectExistingTable(supabase: any, candidates: string[]) {
  for (const t of candidates) {
    try {
      const { error } = await supabase.from(t).select('id').limit(1);
      if (!error) return t;
    } catch {}
  }
  return candidates[0];
}

export function useInvoice(id: string, { enabled = true } = {}) {
  const supabase = useSupabaseClient();
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;

  return useQuery({
    queryKey: ['invoice', mamaId, id],
    enabled: enabled && !!id && !!mamaId,
    queryFn: async () => {
      const tableLines = await detectExistingTable(supabase, ['facture_lignes', 'lignes_facture']);
      const [headerRes, linesRes] = await Promise.all([
        supabase
          .from('factures')
          .select(
            'id, numero, date_facture, fournisseur_id, tva_mode, actif, created_at, updated_at, statut, bon_livraison, total_ht, total_tva, total_ttc, fournisseur:fournisseurs(id, nom)'
          )
          .eq('id', id)
          .eq('mama_id', mamaId)
          .single(),
        supabase
          .from(tableLines)
          .select(
            'id, facture_id, produit_id, quantite, unite, total_ht, pu, pmp, tva, zone_id, position, note, actif, produit:produits(id, nom, code, ref_fournisseur, unite_achat, unite, tva_id, zone_stock_id)'
          )
          .eq('facture_id', id)
          .order('position', { ascending: true }),
      ]);
      const { data: facture, error: e1 } = headerRes;
      const { data: lignes, error: e2 } = linesRes;
      if (e1 || e2) throw e1 || e2;
      return { facture, lignes: lignes || [] };
    },
  });
}

export default useInvoice;

