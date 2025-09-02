// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useMamaSettings } from '@/hooks/useMamaSettings';

export const useSousFamilles = () => {
  const { mamaId } = useMamaSettings();
  return useQuery({
    queryKey: ['sous-familles', mamaId],
    enabled: !!mamaId,
    queryFn: async () => {
      // Colonnes : id, nom, famille_id, actif, mama_id
      const { data, error } = await supabase
        .from('sous_familles')
        .select('id, nom, famille_id, actif, mama_id')
        .eq('mama_id', mamaId)
        .order('nom', { ascending: true });

      if (error) {
        console.warn('[sous_familles] fallback []', error);
        return [];
      }
      return Array.isArray(data) ? data : [];
    },
  });
};
export default useSousFamilles;
