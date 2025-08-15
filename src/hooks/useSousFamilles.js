// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useSousFamilles() {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const list = useCallback(
    async ({ search = '', actif, familleId } = {}) => {
      if (!mama_id) return { data: [], error: null };
      setLoading(true);
      setError(null);
      let query = supabase.from('sous_familles').select('*').eq('mama_id', mama_id);
      if (search) query = query.ilike('nom', `%${search}%`);
      if (typeof actif === 'boolean') query = query.eq('actif', actif);
      if (familleId) query = query.eq('famille_id', familleId);
      const { data, error } = await query;
      if (error) {
        setError(error);
        toast.error('Erreur chargement sous-familles');
        setSousFamilles([]);
      } else {
        setSousFamilles(Array.isArray(data) ? data : []);
      }
      setLoading(false);
      return { data: data || [], error };
    },
    [mama_id]
  );

  const create = useCallback(
    async (payload) => {
      if (!mama_id) return { error: 'Aucun mama_id' };
      const { data, error } = await supabase
        .from('sous_familles')
        .insert([{ ...payload, mama_id }])
        .select('*')
        .single();
      if (error) {
        toast.error("Erreur lors de l'ajout");
        return { error };
      }
      await list({ familleId: payload.famille_id });
      return { data };
    },
    [mama_id, list]
  );

  const update = useCallback(
    async (id, payload) => {
      if (!mama_id) return { error: 'Aucun mama_id' };
      const { error } = await supabase
        .from('sous_familles')
        .update(payload)
        .eq('id', id)
        .eq('mama_id', mama_id);
      if (error) toast.error('Erreur lors de la mise à jour');
      await list({ familleId: payload.famille_id });
      return { error };
    },
    [mama_id, list]
  );

  const toggleActif = useCallback(
    async (id, actif) => {
      return update(id, { actif });
    },
    [update]
  );

  const remove = useCallback(
    async (id) => {
      if (!mama_id) return { error: 'Aucun mama_id' };
      const { error } = await supabase
        .from('sous_familles')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id);
      if (error) toast.error('Erreur lors de la suppression');
      return { error };
    },
    [mama_id]
  );

  return { sousFamilles, list, create, update, toggleActif, remove, loading, error };
}
