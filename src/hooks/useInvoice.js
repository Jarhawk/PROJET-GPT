// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

async function detectExistingTable(candidates) {
  for (const t of candidates) {
    try {
      const { error } = await supabase.from(t).select('id').limit(1);
      if (!error) return t;
    } catch {}
  }
  return candidates[0];
}

export function useInvoice(id, { enabled = true } = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;

  return useQuery({
    queryKey: ['invoice', mamaId, id],
    enabled: enabled && !!id && !!mamaId,
    queryFn: async () => {
      const tableLines = await detectExistingTable(['facture_lignes', 'lignes_facture']);
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
          .order('position', { ascending: true })
      ]);
      const { data: facture, error: e1 } = headerRes;
      const { data: lignes, error: e2 } = linesRes;
      if (e1 || e2) throw e1 || e2;
      return { facture, lignes: lignes || [] };
    },
  });
}

export function useSaveFacture(mamaId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('save_facture', {
        mama_id: mamaId,
        ...payload,
      });
      if (error) throw error;
      return data;
    },
    onMutate: () => ({ toastId: toast.loading('Enregistrement...') }),
    onError: (err, _variables, context) => {
      toast.error(err.message || 'Erreur lors de l\'enregistrement', {
        id: context?.toastId,
      });
    },
    onSuccess: (_data, _variables, context) => {
      toast.success('Facture enregistrée', { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}

export default useInvoice;
