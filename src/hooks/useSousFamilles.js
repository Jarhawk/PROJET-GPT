// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);

  const list = useCallback(
    async ({ search = '', actif, familleId } = {}) => {
      let q = supabase.from('sous_familles').select('*').eq('mama_id', mama_id);
      if (typeof actif === 'boolean') q = q.eq('actif', actif);
      if (familleId) q = q.eq('famille_id', familleId);
      if (search) q = q.ilike('nom', `%${search}%`);
      const { data } = await q;
      setItems(data || []);
      return data || [];
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

export default useSousFamilles;
