// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * options: {
 *   auto: boolean (par défaut false)
 *   interval: nombre de ms pour le refresh auto (ex: 30000)
 *   retry: nombre d’essais max (ex: 2)
 *   page: numéro de page (1 par défaut)
 *   pageSize: nombre de lignes par page (défaut 30)
 *   params: params SQL additionnels pour la fonction (objet)
 * }
 */
export function useDashboardStats(options = {}) {
  const { mama_id, loading: authLoading } = useAuth();
  const {
    auto = false,
    interval = 30000,
    retry = 2,
    page = 1,
    pageSize = 30,
    params = {},
  } = options;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const retries = useRef(0);
  const intervalId = useRef(null);

  // Fonction unique pour fetch (callback pour dépendances stables)
  const fetchStats = useCallback(async (opts = {}) => {
    if (!mama_id || authLoading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("dashboard_stats", {
        mama_id_param: mama_id,
        page_param: opts.page || page,
        page_size_param: opts.pageSize || pageSize,
        ...params,
        ...opts.params, // surcharge possible
      });
      if (error) throw error;
      setStats(data);
      retries.current = 0; // Reset retry si succès
    } catch (err) {
      console.error('Erreur dashboard_stats:', err);
      setError(err.message || "Erreur récupération stats dashboard.");
      setStats(null);
      // Retry intelligent
      if (retries.current < retry) {
        retries.current += 1;
        setTimeout(() => fetchStats(opts), 1200); // attente avant retry
      }
    } finally {
      setLoading(false);
    }
  }, [mama_id, authLoading, params, page, pageSize, retry]);

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

  // Pagination : fetch si page/pageSize changent (hors auto)
  useEffect(() => {
    if (auto) return;
    if (!mama_id || authLoading) return;
    fetchStats({ page, pageSize });
  }, [page, pageSize, mama_id, authLoading, auto, fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    // helpers
    refresh: fetchStats,
    setPage: (p) => fetchStats({ page: p, pageSize }),
    setPageSize: (sz) => fetchStats({ page, pageSize: sz }),
  };
}
