import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/hooks/useSupabaseClient'
import { useAuth } from '@/contexts/AuthContext'

type UUID = string

export type FactureLigne = {
  id: UUID
  facture_id: UUID
  produit_id: UUID
  quantite: number
  prix_unitaire: number | null
  tva: number | null
  remise: number | null
  total_ht: number | null
  total_ttc: number | null
  produit?: { id: UUID; nom: string } | null
}

export type Facture = {
  id: UUID
  mama_id: UUID
  numero: string
  date_facture: string
  fournisseur_id: UUID | null
  total_ht: number | null
  total_ttc: number | null
  lignes?: FactureLigne[]
}

export function useInvoice(id: string | undefined) {
  const { supabase } = useSupabase()
  const { session } = useAuth()
  const mamaId = (session?.user?.user_metadata?.mama_id ?? session?.user?.mama_id ?? '').toString()

  const enabled = !!id && id !== 'new' && mamaId.length > 0

  return useQuery({
    queryKey: ['invoice', id, mamaId],
    enabled,
    queryFn: async (): Promise<Facture> => {
      const { data, error } = await supabase
        .from('factures')
        .select(`
          id, mama_id, numero, date_facture, fournisseur_id, total_ht, total_ttc,
          lignes:facture_lignes (
            id, facture_id, produit_id, quantite, prix_unitaire, tva, remise, total_ht, total_ttc,
            produit:produit_id ( id, nom )
          )
        `)
        .eq('id', id!)
        .eq('mama_id', mamaId)
        .maybeSingle()

      if (error) {
        console.error('[useInvoice] error', error)
        throw error
      }
      if (!data) {
        throw new Error('Facture introuvable ou non autorisée (RLS).')
      }
      return data as unknown as Facture
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}
