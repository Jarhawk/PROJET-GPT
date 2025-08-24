// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import useMamaSettings from '@/hooks/useMamaSettings';

export const useSousFamilles = () => {
  const { mamaId } = useMamaSettings();
  return useQuery({
    queryKey: ['sous-familles', mamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sous_familles')
        .select('id, nom, actif, famille_id')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });
      if (error) {
        console.warn('[sous_familles] fallback []', error);
        return [];
      }
      return data ?? [];
    },
  });
};
export default useSousFamilles;
