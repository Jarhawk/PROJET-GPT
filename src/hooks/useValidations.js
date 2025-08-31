// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function useValidations() {
  const { mama_id, user } = useAuth();
  const user_id = user?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!mama_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('validation_requests')
      .select('id, module, payload, status:statut, created_at')
      .eq('mama_id', mama_id)
      .eq('actif', true)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [mama_id]);

  async function addRequest({ module, entity_id, action }) {
    const payload = { entity_id, action };
    const { error } = await supabase
      .from('validation_requests')
      .insert([{ module, payload, user_id, mama_id, statut: 'pending', actif: true }]);
    if (error) setError(error.message);
    return { error };
  }

  async function updateStatus(id, statut) {
    const { error } = await supabase
      .from('validation_requests')
      .update({ statut })
      .eq('id', id)
      .eq('mama_id', mama_id)
      .eq('actif', true);
    if (error) setError(error.message);
    return { error };
  }

  return { items, loading, error, fetchRequests, addRequest, updateStatus };
}

