import { useState, useEffect, useCallback } from 'react';
import useSupabaseClient from '@/hooks/useSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function useConsoMoyenne() {
  const supabase = useSupabaseClient();
  const { mama_id } = useAuth();
  const [avg, setAvg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!mama_id) return 0;
    setLoading(true);
    setError(null);
    try {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const { data, error } = await supabase
        .from('requisition_lignes')
        .select('quantite, requisitions!inner(date_requisition,mama_id,statut)')
        .eq('requisitions.mama_id', mama_id)
        .eq('requisitions.statut', 'réalisée')
        .gte('requisitions.date_requisition', start.toISOString())
        .order('requisitions.date_requisition', { ascending: true });
      if (error) throw error;
      const daily = {};
      (data || []).forEach((m) => {
        const d = m.requisitions.date_requisition?.slice(0, 10);
        if (!daily[d]) daily[d] = 0;
        daily[d] += Number(m.quantite || 0);
      });
      const values = Object.values(daily);
      const avgValue = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      setAvg(avgValue);
      if (import.meta.env.DEV) {
        console.debug('Chargement dashboard terminé');
      }
      return avgValue;
    } catch (e) {
      console.warn('useConsoMoyenne', e);
      setError(e);
      setAvg(0);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [mama_id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { avg, loading, error, refresh: fetchData };
}
