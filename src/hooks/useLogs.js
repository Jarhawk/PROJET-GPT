// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

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
      .from('logs_securite')
      .select(
        'id, type, description, module:type_evenement, critique:niveau_criticite, date_log:date_evenement, utilisateur:utilisateur_id(nom)'
      )
      .eq('mama_id', mama_id)
      .eq('utilisateur.mama_id', mama_id)
      .order('date_evenement', { ascending: false });
    if (type) query = query.eq('type', type);
    if (module) query = query.eq('type_evenement', module);
    if (start) query = query.gte('date_evenement', start);
    if (end) query = query.lte('date_evenement', end);
    if (critique !== undefined) query = query.eq('niveau_criticite', critique);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    const rows = Array.isArray(data) ? data : [];
    setLogs(rows);
    return rows;
  }

  async function fetchRapports() {
    setRapports([]);
    return [];
  }

  async function downloadRapport() {
    return null;
  }

  async function exportLogs(format = "csv") {
    const safe = Array.isArray(logs) ? logs : [];
    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(safe);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf]), "logs.xlsx");
    } else if (format === "pdf") {
      const mod = await import("jspdf");
      const jsPDF = mod.default || mod.jsPDF || mod;
      const autoTableMod = await import("jspdf-autotable");
      const autoTable = autoTableMod.default || autoTableMod;
      const doc = new jsPDF();
      const rows = [];
      for (const l of safe) {
        rows.push([
          l.date_log,
          l.type,
          l.module,
          l.description,
          l.critique ? "oui" : "non",
        ]);
      }
      autoTable(doc, {
        head: [["Date", "Type", "Module", "Description", "Critique"]],
        body: rows,
      });
      doc.save("logs.pdf");
    } else {
      const header = "Date;Type;Module;Description;Critique\n";
      let csv = "";
      for (const l of safe) {
        csv += `${l.date_log};${l.type};${l.module};${l.description};${l.critique}\n`;
      }
      const blob = new Blob([header + csv.trimEnd()], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "logs.csv");
    }
  }

  return {
    logs,
    rapports,
    loading,
    error,
    fetchLogs,
    fetchRapports,
    downloadRapport,
    exportLogs,
  };
}

export default useLogs;
