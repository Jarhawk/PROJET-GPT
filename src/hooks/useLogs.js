// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useLogs() {
  const { mama_id } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLogs({
    search = "",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 100,
    ip = null,
    utilisateur = null,
    date = null,
    type = null,
  } = {}) {
    if (!mama_id) {
      return [];
    }
    setLoading(true);
    setError(null);

    if (ip || utilisateur || date || type) {
      let q1 = supabase
        .from("journaux_utilisateur")
        .select(
          "id, utilisateur_id, action, page, ip, date_action, mama_id, utilisateurs:utilisateur_id(nom)"
        )
        .eq("mama_id", mama_id)
        .order("date_action", { ascending: false });
      if (ip) q1 = q1.eq("ip", ip);
      if (utilisateur) q1 = q1.eq("utilisateur_id", utilisateur);
      if (date) q1 = q1.gte("date_action", date).lt("date_action", date + "T23:59:59");
      if (type) q1 = q1.ilike("action", `%${type}%`);

      let q2 = supabase
        .from("logs_securite")
        .select(
          "id, type_evenement, details, date_evenement, niveau_criticite, ip, utilisateur_id, mama_id, utilisateurs:utilisateur_id(nom)"
        )
        .eq("mama_id", mama_id)
        .order("date_evenement", { ascending: false });
      if (ip) q2 = q2.eq("ip", ip);
      if (utilisateur) q2 = q2.eq("utilisateur_id", utilisateur);
      if (date) q2 = q2.gte("date_evenement", date).lt("date_evenement", date + "T23:59:59");
      if (type) q2 = q2.ilike("type_evenement", `%${type}%`);

      const [{ data: d1, error: e1 }, { data: d2, error: e2 }] = await Promise.all([q1, q2]);
      setLoading(false);
      if (e1 || e2) {
        setError(e1 || e2);
        setLogs([]);
        return [];
      }
      const rows = [];
      (d1 || []).forEach((l) => rows.push({ ...l, source: "activite" }));
      (d2 || []).forEach((l) => rows.push({ ...l, source: "securite" }));
      rows.sort(
        (a, b) =>
          new Date(b.date_action || b.date_evenement).getTime() -
          new Date(a.date_action || a.date_evenement).getTime()
      );
      setLogs(rows);
      return rows;
    }

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
    const rows = (logs || []).map((l) => ({
      date: l.date_action || l.date_evenement || l.created_at,
      action: l.action || l.type_evenement,
      ip: l.ip || "",
      utilisateur: l.utilisateurs?.nom || l.utilisateur_id || l.done_by,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Logs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "logs.xlsx");
  }

  return { logs, loading, error, fetchLogs, exportLogsToExcel };
}
