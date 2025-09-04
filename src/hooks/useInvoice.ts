import supabase from '@/lib/supabase';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';

type UUID = string;

export type FactureLigne = {
  id: UUID;
  facture_id: UUID;
  produit_id: UUID;
  quantite: number;
  prix_unitaire: number | null;
  tva: number | null;
  remise: number | null;
  total_ht: number | null;
  total_ttc: number | null;
  produit?: { id: UUID; nom: string } | null;
};

export type Facture = {
  id: UUID;
  mama_id: UUID;
  numero: string;
  date_facture: string;
  fournisseur_id: UUID | null;
  montant: number | null;
  statut: string | null;
  lignes?: FactureLigne[];
};

type FactureHead = Omit<Facture, 'lignes'>;

async function fetchInvoiceAndLinesSeparately(id: UUID, mamaId: UUID): Promise<Facture> {
  const { data: head, error: e1 } = await supabase
    .from('factures')
    .select('id, mama_id, numero, date_facture, fournisseur_id, montant, statut')
    .returns<FactureHead>()
    .eq('mama_id', mamaId)
    .eq('id', id)
    .maybeSingle();
  if (e1) throw e1;
  if (!head) throw new Error('Facture introuvable');

  const { data: lignes, error: e2 } = await supabase
    .from('facture_lignes')
    .select(
      'id, facture_id, produit_id, quantite, prix_unitaire, tva, remise, total_ht, total_ttc, produit:produit_id(id, nom)'
    )
    .returns<FactureLigne[]>()
    .eq('mama_id', mamaId)
    .eq('facture_id', id);
  if (e2) throw e2;

  return { ...head, lignes: lignes ?? undefined };
}

export function useInvoice(id: UUID | undefined): UseQueryResult<Facture> {
  const auth = useAuth();
  if (!auth) throw new Error('Auth indisponible');
  const { session } = auth;
  const mamaId = (session?.user?.user_metadata?.mama_id ?? session?.user?.mama_id ?? '').toString();

  const enabled = !!id && id !== 'new' && mamaId.length > 0;

  return useQuery<Facture>({
    queryKey: ['invoice', id, mamaId],
    enabled,
    queryFn: async (): Promise<Facture> => {
      try {
        const { data, error } = await supabase
          .from('factures')
          .select(`
            id, mama_id, numero, date_facture, fournisseur_id, montant, statut,
            lignes:facture_lignes (
              id, facture_id, produit_id, quantite, prix_unitaire, tva, remise, total_ht, total_ttc,
              produit:produit_id ( id, nom )
            )
          `)
          .eq('mama_id', mamaId)
          .eq('id', id!)
          .returns<Facture>()
          .maybeSingle();

        if (error) {
          throw error;
        }
        if (!data) {
          throw new Error('Facture introuvable ou non autorisée (RLS).');
        }
        return data;
      } catch (e) {
        console.warn('[useInvoice] embed failed, fetching separately', e);
        return await fetchInvoiceAndLinesSeparately(id!, mamaId);
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
