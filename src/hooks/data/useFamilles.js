// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useMamaSettings } from '@/hooks/useMamaSettings';

export const useFamilles = () => {
  const { mamaId } = useMamaSettings();
    return useQuery({
      queryKey: ['familles', mamaId],
      enabled: !!mamaId,
      queryFn: async () => {
        // Columns: id, nom, actif
        const { data, error } = await supabase
        .from('familles')
        .select('id, nom, actif')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export default useFamilles;

