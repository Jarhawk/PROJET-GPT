import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function useValidations() {
  const { mama_id, user } = useAuth();
  const user_id = user?.id;

  async function fetchRequests() {
    const { data } = await supabase
      .from('validation_requests')
      .select('id, mama_id, user_id, module, payload, statut:statut, created_at, actif, updated_at')
      .eq('mama_id', mama_id)
      .eq('actif', true)
      .order('created_at', { ascending: false });
    return Array.isArray(data) ? data : [];
  }

  async function addRequest(payload) {
    return supabase
      .from('validation_requests')
      .insert([{ ...payload, mama_id, requested_by: user_id, actif: true }]);
  }

  async function updateStatus(id, statut) {
    return supabase
      .from('validation_requests')
      .update({
        statut,
        reviewed_by: user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('mama_id', mama_id)
      .eq('actif', true);
  }

  return { fetchRequests, addRequest, updateStatus };
}

