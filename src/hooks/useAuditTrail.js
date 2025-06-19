import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAuditTrail() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchEntries({ table = "", start = null, end = null } = {}) {
    setLoading(true);
    let query = supabase
      .from("audit_entries")
      .select("*, users:changed_by(email)")
      .order("changed_at", { ascending: false })
      .limit(100);
    if (table) query = query.eq("table_name", table);
    if (start) query = query.gte("changed_at", start);
    if (end) query = query.lte("changed_at", end);
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
