import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useEmailsEnvoyes() {
  const { mama_id } = useAuth();
  const [emails, setEmails] = useState([]);

  async function fetchEmails({ statut, email, commande_id, date_start, date_end, page = 1, limit = 50 } = {}) {
    let q = supabase
      .from('emails_envoyes')
      .select('id, commande_id, email, statut, envoye_le, mama_id')
      .eq('mama_id', mama_id);
    if (statut) q = q.eq('statut', statut);
    if (email) q = q.ilike('email', `%${email}%`);
    if (commande_id) q = q.eq('commande_id', commande_id);
    if (date_start) q = q.gte('envoye_le', date_start);
    if (date_end) q = q.lte('envoye_le', date_end);
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    q = q.order('envoye_le', { ascending: false }).range(start, end);
    const { data, error } = await q;
    if (error) throw error;
    setEmails(data || []);
    return data;
  }

  return { fetchEmails, emails };
}

export default useEmailsEnvoyes;

