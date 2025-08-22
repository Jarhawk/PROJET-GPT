// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import JSPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useLogs() {
  const { mama_id } = useAuth();
  const [logs, setLogs] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLogs({ type, module, start, end, critique } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("logs_activite")
      .select("*, utilisateurs:user_id(nom)")
      .eq("mama_id", mama_id)
      .order("date_log", { ascending: false });
    if (type) query = query.eq("type", type);
    if (module) query = query.eq("module", module);
    if (start) query = query.gte("date_log", start);
    if (end) query = query.lte("date_log", end);
    if (critique !== undefined) query = query.eq("critique", critique);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setLogs(data || []);
    return data || [];
  }

  async function logAction({ type, module, description, donnees = {}, critique = false }) {
    if (!mama_id) return { error: 'no mama' };
    return supabase.rpc("log_action", {
      p_mama_id: mama_id,
      p_type: type,
      p_module: module,
      p_description: description,
      p_donnees: donnees,
      p_critique: critique,
    });
  }

  async function fetchRapports(filters = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from("rapports_generes")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_generation", { ascending: false });
    if (filters.module) query = query.eq("module", filters.module);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.start) query = query.gte("periode_debut", filters.start);
    if (filters.end) query = query.lte("periode_fin", filters.end);
    const { data, error } = await query;
    if (error) {
      console.error(error);
      return [];
    }
    setRapports(data || []);
    return data || [];
  }

  async function downloadRapport(id) {
    const { data } = await supabase
      .from("rapports_generes")
      .select("chemin_fichier")
      .eq("id", id)
      .single();
    if (data?.chemin_fichier) {
      window.open(data.chemin_fichier, "_blank");
    }
  }

  function exportLogs(format = "csv") {
    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(logs);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf]), "logs.xlsx");
    } else if (format === "pdf") {
      const doc = new JSPDF();
      const rows = logs.map((l) => [l.date_log, l.type, l.module, l.description, l.critique ? "oui" : "non"]);
      autoTable(doc, {
        head: [["Date", "Type", "Module", "Description", "Critique"]],
        body: rows,
      });
      doc.save("logs.pdf");
    } else {
      const header = "Date;Type;Module;Description;Critique\n";
      const csv = logs
        .map((l) => `${l.date_log};${l.type};${l.module};${l.description};${l.critique}`)
        .join("\n");
      const blob = new Blob([header + csv], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "logs.csv");
    }
  }

  return {
    logs,
    rapports,
    loading,
    error,
    fetchLogs,
    logAction,
    fetchRapports,
    downloadRapport,
    exportLogs,
  };
}

export default useLogs;
