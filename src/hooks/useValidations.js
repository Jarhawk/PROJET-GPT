import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

export default function useValidations() {
  const { mama_id, user } = useAuth();
  const user_id = user?.id;

  async function fetchRequests() {
    const { data } = await supabase
      .from('validation_requests')
      .select('*')
      .eq('mama_id', mama_id)
      .eq('actif', true)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async function addRequest(payload) {
    return supabase
      .from('validation_requests')
      .insert([{ ...payload, mama_id, requested_by: user_id, actif: true }]);
  }

  async function updateStatus(id, status) {
    return supabase
      .from('validation_requests')
      .update({
        status,
        reviewed_by: user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('mama_id', mama_id)
      .eq('actif', true);
  }

  return { fetchRequests, addRequest, updateStatus };
}

