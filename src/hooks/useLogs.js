// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Hook utilitaire pour la supervision des logs et des rapports générés.
 * Permet de lire/écrire dans les tables `logs_activite` et `rapports_generes`.
 */
export function useLogs() {
  const { mama_id } = useAuth();
  const [logs, setLogs] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Récupère les logs filtrés.
   * @param {object} filtres
   */
  async function fetchLogs({ type, module, start, end, critique } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("logs_activite")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_log", { ascending: false });
    if (type) query = query.eq("type", type);
    if (module) query = query.eq("module", module);
    if (start) query = query.gte("date_log", start);
    if (end) query = query.lte("date_log", end);
    if (typeof critique === "boolean") query = query.eq("critique", critique);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      setLogs([]);
      return [];
    }
    setLogs(data || []);
    return data || [];
  }

  /**
   * Appelle la fonction RPC pour insérer un log d'action.
   */
  async function logAction({ type, module, description, donnees = {}, critique = false }) {
    if (!mama_id) return;
    await supabase.rpc("log_action", {
      p_mama_id: mama_id,
      p_type: type,
      p_module: module,
      p_description: description,
      p_donnees: donnees,
      p_critique: critique,
    });
  }

  /**
   * Récupère la liste des rapports générés.
   */
  async function fetchRapports({ module, type, start, end } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("rapports_generes")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_generation", { ascending: false });
    if (module) query = query.eq("module", module);
    if (type) query = query.eq("type", type);
    if (start) query = query.gte("date_generation", start);
    if (end) query = query.lte("date_generation", end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      setRapports([]);
      return [];
    }
    setRapports(data || []);
    return data || [];
  }

  /**
   * Télécharge le rapport correspondant à l'id fourni.
   */
  async function downloadRapport(id) {
    const { data, error } = await supabase
      .from("rapports_generes")
      .select("chemin_fichier")
      .eq("id", id)
      .single();
    if (error || !data?.chemin_fichier) return null;
    const link = document.createElement("a");
    link.href = data.chemin_fichier;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return data.chemin_fichier;
  }

  /**
   * Exporte les logs déjà chargés dans le format indiqué.
   * @param {'csv'|'xlsx'|'pdf'} format
   */
  function exportLogs(format = "csv") {
    const rows = (logs || []).map((l) => ({
      date: l.date_log,
      type: l.type,
      module: l.module,
      description: l.description,
      critique: l.critique ? "oui" : "non",
    }));

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Logs");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf]), "logs.xlsx");
      return;
    }

    if (format === "pdf") {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [["Date", "Type", "Module", "Description", "Critique"]],
        body: rows.map((r) => [r.date, r.type, r.module, r.description, r.critique]),
      });
      doc.save("logs.pdf");
      return;
    }

    // CSV par défaut
    const header = "date,type,module,description,critique\n";
    const csv =
      header +
      rows
        .map((r) =>
          [r.date, r.type, r.module, r.description, r.critique]
            .map((x) => `"${(x ?? "").toString().replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "logs.csv");
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

