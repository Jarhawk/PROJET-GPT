// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useRoles() {
  const { mama_id } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    if (!mama_id) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from('roles')
      .select('id, nom, description, access_rights, actif, mama_id, created_at, updated_at')
      .eq('mama_id', mama_id)
      .order('nom', { ascending: true });
    const rows = error ? [] : Array.isArray(data) ? data : [];
    if (!error) setRoles(rows);
    setLoading(false);
    return rows;
  };

  const addOrUpdateRole = async (role) => {
    if (!mama_id) return { data: null, error: 'mama_id manquant' };
    const { data, error } = await supabase
      .from('roles')
      .upsert({ ...role, mama_id }, { onConflict: 'id' })
      .select('id, nom, description, access_rights, actif, mama_id, created_at, updated_at')
      .single();
    if (!error) fetchRoles();
    return { data, error };
  };

  const toggleActif = async (id, actif) => {
    if (!mama_id) return { error: 'mama_id manquant' };
    const { error } = await supabase
      .from('roles')
      .update({ actif })
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (!error) fetchRoles();
    return { error };
  };

  useEffect(() => {
    fetchRoles();
  }, [mama_id]);

  return { roles, loading, fetchRoles, addOrUpdateRole, toggleActif };
}
