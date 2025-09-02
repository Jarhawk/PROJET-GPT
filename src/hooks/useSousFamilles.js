// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const list = useCallback(
    async ({ search = '', actif, familleId } = {}) => {
      setLoading(true);
      setError(null);
      let q = supabase
        .from('sous_familles')
        .select('id, nom, famille_id, mama_id, actif')
        .eq('mama_id', mama_id);
      if (typeof q.order === 'function') {
        q = q.order('nom', { ascending: true });
      }
      if (typeof actif === 'boolean') q = q.eq('actif', actif);
      if (familleId) q = q.eq('famille_id', familleId);
      if (search) q = q.ilike('nom', `%${search}%`);
      const { data, error: queryError } = await q;
      if (queryError) setError(queryError);
      const list = Array.isArray(data) ? data : [];
      setSousFamilles(list);
      setLoading(false);
      return { data: list, error: queryError };
    },
    [mama_id]
  );

  const create = useCallback(
    async ({ nom, famille_id }) => {
      const { data } = await supabase
        .from('sous_familles')
        .insert([{ nom, famille_id, mama_id, actif: true }])
        .eq('mama_id', mama_id)
        .select('id, nom, famille_id, actif, mama_id')
        .single();
      setSousFamilles((prev) =>
        Array.isArray(prev) ? [data, ...prev] : [data]
      );
      return data;
    },
    [mama_id]
  );

  const toggleActif = useCallback(
    async (id, value) => {
      await supabase
        .from('sous_familles')
        .update({ actif: value })
        .eq('id', id)
        .eq('mama_id', mama_id);
      setSousFamilles((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        const out = [];
        for (const s of arr) {
          out.push(s.id === id ? { ...s, actif: value } : s);
        }
        return out;
      });
    },
    [mama_id]
  );

  return {
    sousFamilles: sousFamilles ?? [],
    items: sousFamilles ?? [],
    list,
    create,
    toggleActif,
    loading,
    isLoading: loading,
    error,
  };
}

export async function fetchSousFamilles({ mamaId }) {
  try {
    let q = supabase
      .from('sous_familles')
      .select('id, nom, famille_id, mama_id, actif')
      .eq('mama_id', mamaId);
    if (typeof q.order === 'function') {
      q = q.order('nom', { ascending: true });
    }
      const { data, error } = await q;
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('[sous_familles] fallback []', e);
      return [];
  }
}

export default useSousFamilles;
