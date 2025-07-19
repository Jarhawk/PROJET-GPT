// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useAuditTrail() {
  const { mama_id } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchEntries({ table = "", start = null, end = null } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    let query = supabase
      .from("journal_audit")
      .select("*, utilisateurs:utilisateur_id(nom)")
      .order("date_action", { ascending: false })
      .limit(100);
    if (table) query = query.eq("table_modifiee", table);
    if (start) query = query.gte("date_action", start);
    if (end) query = query.lte("date_action", end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setEntries([]);
      return [];
    }
    setEntries(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { entries, loading, error, fetchEntries };
}
