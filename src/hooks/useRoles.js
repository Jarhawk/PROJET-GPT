// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import supabase from '@/lib/supabaseClient';

export function useRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("nom", { ascending: true });
    if (!error) setRoles(data);
    setLoading(false);
  };

  const addOrUpdateRole = async role => {
    const { data, error } = await supabase
      .from("roles")
      .upsert(role)
      .select();
    if (!error) fetchRoles();
    return { data, error };
  };

  const toggleActif = async (id, actif) => {
    const { error } = await supabase
      .from("roles")
      .update({ actif })
      .eq("id", id);
    if (!error) fetchRoles();
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, fetchRoles, addOrUpdateRole, toggleActif };
}
