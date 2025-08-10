import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export function useEmailsEnvoyes() {
    const { mamaId, loading } = useAuth() || {};
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

    const baseQuery = useMemo(() => {
      return supabase.from("emails_envoyes").select("*")
        .eq("mama_id", mamaId)
        .order("envoye_le", { ascending: false });
    }, [mamaId]);

  const fetchEmails = useCallback(async (filters = {}) => {
    setLoading(true);
    setErr(null);
    let q = baseQuery;
    if (filters.commande_id) q = q.eq("commande_id", filters.commande_id);
    if (filters.statut) q = q.eq("statut", filters.statut);
    const { data, error } = await q;
    if (error) { setErr(error); setLoading(false); return []; }
    setList(data || []);
    setLoading(false);
    return data || [];
  }, [baseQuery]);

  const logEmail = useCallback(async ({ commande_id, email, statut = "en_attente" }) => {
    setErr(null);
    const { error } = await supabase.from("emails_envoyes").insert([{ 
      commande_id, email, statut, mama_id: mamaId
    }]);
    if (error) { setErr(error); return { ok: false, error }; }
    await fetchEmails();
    return { ok: true };
  }, [fetchEmails, mamaId]);

    useEffect(() => {
      if (loading) return;
      if (!mamaId) return;
      fetchEmails();
    }, [loading, mamaId, fetchEmails]);

  return { list, loading, error: err, fetchEmails, logEmail };
}

export default useEmailsEnvoyes;
