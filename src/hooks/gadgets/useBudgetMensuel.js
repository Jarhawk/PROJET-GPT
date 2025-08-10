import { useQuery } from '@tanstack/react-query';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function useBudgetMensuel() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();

  const periode = new Date().toISOString().slice(0, 7);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['budgetMensuel', mama_id, periode],
    queryFn: async () => {
      if (!mama_id) return { cible: 0, reel: 0 };
      const { data, error } = await supabase.rpc('fn_calc_budgets', {
        mama_id_param: mama_id,
        periode_param: periode,
      });
      if (error) throw error;
      let cible = 0;
      let reel = 0;
      (data || []).forEach((b) => {
        cible += Number(b.budget || b.cible || 0);
        reel += Number(b.reel || b.depense || b.total || 0);
      });
      if (import.meta.env.DEV) {
        console.debug('Chargement dashboard terminé');
      }
      return { cible, reel };
    },
    staleTime: 1000 * 60 * 5,
  });

  return { ...(data || { cible: 0, reel: 0 }), loading: isLoading, error, refresh: refetch };
}
