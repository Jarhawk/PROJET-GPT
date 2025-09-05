import supabase from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

import { getQueryClient } from '@/lib/react-query';

export async function fetchZonesForValidation(mama_id) {
  const { data, error } = await supabase
    .from('zones_stock')
    .select('id, nom')
    .eq('mama_id', mama_id)
    .order('nom', { ascending: true });
  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}

export default function useZonesStock() {
  const { mama_id: mamaId } = useAuth();
  const query = useQuery({
    queryKey: ['zones_stock', mamaId],
    enabled: !!mamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones_stock')
        .select('id, nom')
        .eq('mama_id', mamaId)
        .eq('actif', true)
        .order('nom', { ascending: true });
      if (error) {
        console.warn('[useZonesStock] query error', error);
        return [];
      }
      return data ?? [];
    }
  }, getQueryClient());
  return { data: query.data ?? [], isLoading: query.isLoading, error: query.error };
}