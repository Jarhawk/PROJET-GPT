import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { getQueryClient } from '@/lib/react-query';

export async function fetchZonesForValidation(mama_id) {
  const { data, error } = await supabase
    .from('zones_stock')
    .select('id, nom')
    .eq('mama_id', mama_id)
    .order('nom', { ascending: true });
  return { data: data ?? [], error };
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
      if (error) throw error;
      return data ?? [];
    },
  }, getQueryClient());
  return { ...query, zones: query.data ?? [] };
}

