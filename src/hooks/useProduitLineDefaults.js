// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
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
        const [prodRes, pmpRes] = await Promise.all([
          supabase
            .from('produits')
            .select('unite_id')
            .eq('id', produit_id)
            .eq('mama_id', mama_id)
            .maybeSingle(),
          supabase
            .from('v_pmp')
            .select('pmp')
            .eq('mama_id', mama_id)
            .eq('produit_id', produit_id)
            .maybeSingle(),
        ]);

        const unite_id = prodRes.data?.unite_id ?? null;

        const { data: uniteData } = unite_id
          ? await supabase
              .from('unites')
              .select('nom')
              .eq('id', unite_id)
              .eq('mama_id', mama_id)
              .maybeSingle()
          : { data: null };

        return {
          unite_id,
          unite: uniteData?.nom ?? '',
          pmp: Number(pmpRes.data?.pmp ?? 0),
        };
      },
    });
  };

  return { fetchDefaults };
}

export default useProduitLineDefaults;
