// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * options: {
 *   auto: boolean (par défaut false)
 *   interval: nombre de ms pour le refresh auto (ex: 30000)
 *   retry: nombre d’essais max (ex: 2)
 * }
 */
export function useDashboardStats(options = {}) {
  const { mama_id, loading: authLoading } = useAuth();
  const {
    auto = false,
    interval = 30000,
    retry = 2,
  } = options;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const retries = useRef(0);
  const intervalId = useRef(null);

  // Fonction unique pour fetch (callback pour dépendances stables)
  const fetchStats = useCallback(
    async (opts = {}) => {
      if (!mama_id || authLoading) return;
      setLoading(true);
      setError(null);
      try {
        const { data: produitsData, error: produitsErr } = await supabase
          .from('produits')
          .select('id, nom, stock_reel, pmp, mama_id')
          .eq('mama_id', mama_id);
        if (produitsErr) throw produitsErr;

        const { data: lastData, error: lastErr } = await supabase
          .from('v_produits_dernier_prix')
          .select('produit_id, last_purchase:date_livraison, mama_id')
          .eq('mama_id', mama_id);
        if (lastErr) throw lastErr;

        const lastRows = Array.isArray(lastData) ? lastData : [];
        const lastMap = new Map();
        for (const r of lastRows) {
          lastMap.set(r.produit_id, r.last_purchase);
        }

        const produitsRows = Array.isArray(produitsData) ? produitsData : [];
        const rows = [];
        for (const p of produitsRows) {
          rows.push({
            produit_id: p.id,
            nom: p.nom,
            stock_reel: p.stock_reel,
            pmp: p.pmp,
            last_purchase: lastMap.get(p.id) || null,
          });
        }

        setStats(rows);
        retries.current = 0; // Reset retry si succès
      } catch (err) {
        console.error('Erreur récupération stats dashboard:', err);
        setError(err.message || 'Erreur récupération stats dashboard.');
        setStats(null);
        // Retry intelligent
        if (retries.current < retry) {
          retries.current += 1;
          setTimeout(() => fetchStats(opts), 1200); // attente avant retry
        }
      } finally {
        setLoading(false);
      }
    },
    [mama_id, authLoading, retry]
  );

  // Refresh auto si demandé
  useEffect(() => {
    if (!auto) return;
    if (!mama_id || authLoading) return;
    fetchStats();
    intervalId.current = setInterval(fetchStats, interval);
    return () => clearInterval(intervalId.current);
  }, [auto, interval, fetchStats, mama_id, authLoading]);

  // Reset stats si déconnexion/changement user
  useEffect(() => {
    if (!mama_id && !authLoading) setStats(null);
  }, [mama_id, authLoading]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    // helpers
    refresh: fetchStats,
  };
}
