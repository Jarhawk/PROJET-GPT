import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export async function fetchConsoMoyenne(mamaId, sinceISO) {

  // NOTE: "quantite" DOIT correspondre au vrai nom (ou à l’alias de la vue v_requisition_lignes)
  const { data, error } = await supabase
    .from('requisition_lignes') // ou 'v_requisition_lignes' si tu as créé la vue alias
    .select(`
      quantite,
      requisitions!inner (
        date_requisition,
        mama_id,
        statut
      )
    `)
    .eq('requisitions.mama_id', mamaId)
    .eq('requisitions.statut', 'réalisée')
    .gte('requisitions.date_requisition', sinceISO)
    // Tri sur le champ de la table référencée
    .order('date_requisition', { referencedTable: 'requisitions', ascending: true });

  if (error) throw error;
  return data;
}

export default function useConsoMoyenne() {
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
      const data = await fetchConsoMoyenne(mama_id, start.toISOString());

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
      console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
      setError(e);
      setAvg(0);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [mama_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { avg, loading, error, refresh: fetchData };
}

