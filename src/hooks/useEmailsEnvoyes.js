import supabase from '@/lib/supabase';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { createAsyncState } from './_shared/createAsyncState';
import { applyRange } from '@/lib/supa/range';

export function useEmailsEnvoyes() {
  const { mama_id } = useAuth();
  const [state, setState] = useState(() => createAsyncState([]));

  async function fetchEmails({
    statut,
    email,
    commande_id,
    date_start,
    date_end,
    page = 1,
    limit = 50
  } = {}) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const p = Number(page) || 1;
      const l = Number(limit) || 50;
      const start = (p - 1) * l;
      let q = supabase
        .from('emails_envoyes')
        .select('*')
        .eq('mama_id', mama_id);
      if (statut) q = q.eq('statut', statut);
      if (email) q = q.ilike('email', `%${email}%`);
      if (commande_id) q = q.eq('commande_id', commande_id);
      if (date_start) q = q.gte('envoye_le', date_start);
      if (date_end) q = q.lte('envoye_le', date_end);
      q = q.order('envoye_le', { ascending: false });
      const { data, error } = await applyRange(q, start, l);
      if (error) throw error;
      setState({ data: data || [], loading: false, error: null });
      return data;
    } catch (e) {
      setState({ data: [], loading: false, error: e });
      throw e;
    }
  }

  return { fetchEmails, emails: state.data, loading: state.loading, error: state.error };
}

export default useEmailsEnvoyes;