// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import useSupabaseClient from '@/hooks/useSupabaseClient';

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

export function useFacture() {
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

