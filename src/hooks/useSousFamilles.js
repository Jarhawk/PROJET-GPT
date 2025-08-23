// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);

  const list = useCallback(
    async ({ search = '', actif, familleId } = {}) => {
      const data = await fetchSousFamilles({ mamaId: mama_id });
      let rows = data;
      if (typeof actif === 'boolean') rows = rows.filter((r) => r.actif === actif);
      if (familleId) rows = rows.filter((r) => r.famille_id === familleId);
      if (search)
        rows = rows.filter((r) =>
          r.nom?.toLowerCase().includes(search.toLowerCase())
        );
      setItems(rows);
      return rows;
    },
    [mama_id]
  );

  const create = useCallback(
    async ({ nom, famille_id }) => {
      const { data } = await supabase
        .from('sous_familles')
        .insert([{ nom, famille_id, mama_id, actif: true }])
        .select()
        .single();
      setItems((prev) => [data, ...prev]);
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
      setItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, actif: value } : s))
      );
    },
    [mama_id]
  );

  return { items, list, create, toggleActif };
}

export async function fetchSousFamilles({ mamaId }) {
  try {
    let q = supabase
      .from('sous_familles')
      .select('id, nom, famille_id, mama_id, deleted_at, actif')
      .eq('mama_id', mamaId)
      .order('nom', { ascending: true });
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).filter((r) => !r.deleted_at);
  } catch (e) {
    console.warn('[sous_familles] fallback []', e);
    return [];
  }
}

export default useSousFamilles;
