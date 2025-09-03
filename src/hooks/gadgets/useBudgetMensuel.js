import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useBudgetMensuel() {
  const { mama_id } = useAuth();

  const periode = new Date().toISOString().slice(0, 7);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['budgetMensuel', mama_id, periode],
    queryFn: async () => {
      if (!mama_id) return { cible: 0, reel: 0 };
      try {
        const { data, error } = await supabase.rpc('fn_calc_budgets', {
          mama_id_param: mama_id,
          periode_param: periode,
        });
        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];
        let cible = 0;
        let reel = 0;
        for (const b of rows) {
          cible += Number(b.budget || b.cible || 0);
          reel += Number(b.reel || b.depense || b.total || 0);
        }
        if (import.meta.env.DEV) {
          console.debug('Chargement dashboard terminé');
        }
        return { cible, reel };
      } catch (e) {
        console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
        return { cible: 0, reel: 0 };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return { ...(data || { cible: 0, reel: 0 }), loading: isLoading, error, refresh: refetch };
}
