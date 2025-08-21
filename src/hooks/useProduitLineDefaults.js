// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useProduitLineDefaults() {
  const { mama_id } = useAuth();
  const queryClient = useQueryClient();

  const fetchDefaults = async ({ produit_id } = {}) => {
    if (!mama_id || !produit_id) {
      return { unite_id: null, unite: '', pmp: 0 };
    }

    return queryClient.fetchQuery({
      queryKey: ['produit-line-defaults', mama_id, produit_id],
      queryFn: async () => {
        const [prodRes, lignesRes] = await Promise.all([
          supabase
            .from('produits')
            .select('unite_id')
            .eq('id', produit_id)
            .eq('mama_id', mama_id)
            .maybeSingle(),
          supabase
            .from('facture_lignes')
            .select('pmp, prix_unitaire_ht')
            .eq('mama_id', mama_id)
            .eq('produit_id', produit_id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const unite_id = prodRes.data?.unite_id ?? null;

        const { data: uniteData } = unite_id
          ? await supabase
              .from('unites')
              .select('nom')
              .eq('id', unite_id)
              .maybeSingle()
          : { data: null };

        let pmp = 0;
        const lignes = lignesRes.data || [];
        const withPmp = lignes.find((l) => l.pmp != null);
        if (withPmp) {
          pmp = Number(withPmp.pmp);
        } else if (lignes.length > 0) {
          const sum = lignes.reduce(
            (acc, l) => acc + Number(l.prix_unitaire_ht || 0),
            0
          );
          pmp = sum / lignes.length;
        }

        return {
          unite_id,
          unite: uniteData?.nom ?? '',
          pmp: Number(pmp || 0),
        };
      },
    });
  };

  return { fetchDefaults };
}

export default useProduitLineDefaults;
