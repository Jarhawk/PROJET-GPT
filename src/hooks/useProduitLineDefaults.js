// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useProduitLineDefaults() {
  const { mama_id } = useAuth();
  const queryClient = useQueryClient();

  const fetchDefaults = async ({ produit_id } = {}) => {
    if (!mama_id || !produit_id) {
      return { unite_id: null, unite: '', pmp: 0, tva: 0, zone_id: null };
    }

    return queryClient.fetchQuery({
      queryKey: ['produit-line-defaults', mama_id, produit_id],
      queryFn: async () => {
        const [prodRes, pmpRes, tvaRes, zonesRes] = await Promise.all([
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
          supabase
            .from('facture_lignes')
            .select('tva')
            .eq('mama_id', mama_id)
            .eq('produit_id', produit_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('produits_zones')
            .select('zone_id')
            .eq('mama_id', mama_id)
            .eq('produit_id', produit_id)
            .eq('actif', true),
        ]);

        const unite_id = prodRes.data?.unite_id ?? null;

        const { data: uniteData } = unite_id
          ? await supabase
              .from('unites')
              .select('nom')
              .eq('id', unite_id)
              .maybeSingle()
          : { data: null };

        let zone_id = null;
        const zones = zonesRes.data || [];
        if (zones.length === 1) {
          zone_id = zones[0].zone_id;
        } else {
          const { data: lastZone } = await supabase
            .from('facture_lignes')
            .select('zone_id')
            .eq('mama_id', mama_id)
            .eq('produit_id', produit_id)
            .not('zone_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          zone_id = lastZone?.zone_id ?? null;
        }

        return {
          unite_id,
          unite: uniteData?.nom ?? '',
          pmp: Number(pmpRes.data?.pmp ?? 0),
          tva: Number(tvaRes.data?.tva ?? 0),
          zone_id,
        };
      },
    });
  };

  return { fetchDefaults };
}

export default useProduitLineDefaults;
