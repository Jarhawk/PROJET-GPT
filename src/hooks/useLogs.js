// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useLogs() {
  const { mama_id } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLogs({ search = "", startDate = null, endDate = null, page = 1, limit = 100 } = {}) {
    if (!mama_id) {
      // Skip querying when authentication hasn't provided a mama id yet
      return [];
    }
    setLoading(true);
    setError(null);
    let query = supabase
      .from("journaux_utilisateur")
      .select("*, utilisateurs:done_by(nom)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (search) query = query.ilike("action", `%${search}%`);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      setLogs([]);
      return [];
    }
    setLogs(Array.isArray(data) ? data : []);
    return data || [];
  }

  function exportLogsToExcel() {
    const rows = (logs || []).map(l => ({
      date: l.created_at,
      action: l.action,
      utilisateur: l.utilisateurs?.nom || l.done_by,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Logs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "journal_audit.xlsx");
  }

  return { logs, loading, error, fetchLogs, exportLogsToExcel };
}
