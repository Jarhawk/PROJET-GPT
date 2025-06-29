// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useApiKeys() {
  const { mama_id, user_id } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const listKeys = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('mama_id', mama_id)
      .order('created_at', { ascending: false });
    setKeys(data || []);
    setLoading(false);
    return data || [];
  }, [mama_id]);

  const createKey = useCallback(async ({ name, scopes, role, expiration }) => {
    if (!mama_id || !user_id) return { error: 'missing context' };
    setLoading(true);
    const { data, error } = await supabase
      .from('api_keys')
      .insert([{ name, scopes, role, expiration, mama_id, user_id }])
      .select()
      .single();
    if (!error && data) setKeys(k => [data, ...k]);
    setLoading(false);
    return { data, error };
  }, [mama_id, user_id]);

  const revokeKey = useCallback(async (id) => {
    if (!mama_id) return { error: 'missing mama_id' };
    setLoading(true);
    const { error } = await supabase
      .from('api_keys')
      .update({ revoked: true })
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (!error) setKeys(k => k.map(key => key.id === id ? { ...key, revoked: true } : key));
    setLoading(false);
    return { error };
  }, [mama_id]);

  return { keys, loading, listKeys, createKey, revokeKey };
}
