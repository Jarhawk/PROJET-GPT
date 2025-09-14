// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { applyIlikeOr } from '@/lib/supa/textSearch';

export default function useFournisseursBrowse({
  page = 1,
  limit = 20,
  term = '',
  filters = {}
} = {}) {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  // `filtersKey` suffit à garantir la mise à jour lorsque le contenu change
  const stableFilters = useMemo(() => filters, [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mama_id) return;
    let aborted = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let req = supabase
          .from('fournisseurs')
          .select('id, nom, ville', { count: 'exact' })
          .eq('mama_id', mama_id)
          .eq('actif', true);
        req = applyIlikeOr(req, term);
        Object.entries(stableFilters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            req = req.eq(k, v);
          }
        });
        const start = (page - 1) * limit;
        const end = start + limit - 1;
        const { data, error, count } = await req
          .order('nom', { ascending: true })
          .range(start, end);
        if (error) throw error;
        if (!aborted) {
          setData(data || []);
          setTotal(count || 0);
        }
      } catch (err) {
        console.error('[useFournisseursBrowse]', err);
        if (!aborted) {
          setError(err);
          setData([]);
          setTotal(0);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [mama_id, page, limit, term, filtersKey, stableFilters]);

  return { data, total, loading, error };
}
