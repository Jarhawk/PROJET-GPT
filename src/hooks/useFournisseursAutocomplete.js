import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import useDebounce from '@/hooks/useDebounce';

/**
 * Autocomplete fournisseurs by nom
 * @param {{ term?: string, limit?: number }} params
 */
export function useFournisseursAutocomplete({ term = '', limit = 20 } = {}) {
  const { mama_id } = useAuth();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const search = useDebounce(term, 300);

  useEffect(() => {
    if (!mama_id) return;
    let aborted = false;
    const s = search.trim();
    if (s.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();
      try {
        let req = supabase
          .from('fournisseurs')
          .select('id, nom')
          .eq('mama_id', mama_id)
          .eq('actif', true)
          .order('nom', { ascending: true })
          .limit(limit)
          .ilike('nom', `%${s}%`);
        const { data, error } = await req;
        if (error) throw error;
        if (!aborted) setOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (!aborted) {
          setError(err);
          setOptions([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [mama_id, search, limit]);

  return { options, loading, error };
}

export async function searchFournisseurs(mamaId, term = '', limit = 20) {
  if (!mamaId) return [];
  const supabase = getSupabaseClient();
  let req = supabase
    .from('fournisseurs')
    .select('id, nom')
    .eq('mama_id', mamaId)
    .eq('actif', true)
    .order('nom', { ascending: true })
    .limit(limit);
  if (term && term.trim()) req = req.ilike('nom', `%${term.trim()}%`);
  const { data, error } = await req;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
