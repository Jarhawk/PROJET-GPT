import { useCallback, useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/hooks/useAuth";

export function useEmailsEnvoyes() {
  const { mamaId, loading: authLoading } = useAuth() || {};
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState(null);

  const fetchEmails = useCallback(async ({ commande_id, statut, page = 1, limit = 50 } = {}) => {
    if (!mamaId) return [];
    setIsLoading(true);
    setErr(null);
    let q = supabase
      .from("emails_envoyes")
      .select("*")
      .eq("mama_id", mamaId);
    if (commande_id) q = q.eq("commande_id", commande_id);
    if (statut) q = q.eq("statut", statut);
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    q = q.order("envoye_le", { ascending: false }).range(start, end);
    const { data, error } = await q;
    if (error) { setErr(error); setIsLoading(false); return []; }
    setList(data || []);
    setIsLoading(false);
    return data || [];
  }, [mamaId]);

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
    if (authLoading) return;
    if (!mamaId) return;
    fetchEmails();
  }, [authLoading, mamaId, fetchEmails]);

  const loading = [authLoading, isLoading].some(Boolean);

  return { list, loading, error: err, fetchEmails, logEmail };
}

export default useEmailsEnvoyes;
