// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  mama_id: string;
};

export function useInvoice(id?: string, options: any = {}) {
  const supabase = useSupabaseClient();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['facture', id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factures')
        .select(
          '*, lignes:facture_lignes(*, produit:produit_id(id, nom)), fournisseur:fournisseur_id(id, nom)'
        )
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return { facture: data, lignes: data?.lignes ?? [] };
    },
  });

  const create = useMutation({
    mutationFn: async (payload: FacturePayload) => {
      const { mama_id, ...rest } = payload;
      const { data, error } = await supabase.rpc('fn_facture_save', {
        p_mama_id: mama_id,
        p_payload: rest,
        p_apply_stock: rest.apply_stock ?? false,
      });
      if (error) throw error;
      return data as any; // { facture: {...}, lignes: [...] }
    },
    onSuccess: () => {
      toast.success('Facture enregistrée');
      qc.invalidateQueries({ queryKey: ['factures'] });
    },
    onError: (e: any) => {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement de la facture");
    },
  });

  return { ...query, create };
}

export default useInvoice;

