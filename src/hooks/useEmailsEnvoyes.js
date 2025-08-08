// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useEmailsEnvoyes() {
  const { mama_id } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchEmails({
    statut,
    email,
    date_start,
    date_end,
    commande_id,
    page = 1,
    limit = 50,
  } = {}) {
    if (!mama_id) return { data: [], count: 0 };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("emails_envoyes")
      .select(
        "id, commande_id, email, statut, envoye_le, commandes:commande_id(reference)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("envoye_le", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (statut) query = query.eq("statut", statut);
    if (email) query = query.ilike("email", `%${email}%`);
    if (commande_id) query = query.eq("commande_id", commande_id);
    if (date_start) query = query.gte("envoye_le", date_start);
    if (date_end) query = query.lte("envoye_le", date_end);

    const { data, error, count } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      setEmails([]);
      return { data: [], count: 0 };
    }
    setEmails(Array.isArray(data) ? data : []);
    return { data: data || [], count: count || 0 };
  }

  return { emails, loading, error, fetchEmails };
}
