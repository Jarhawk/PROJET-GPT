// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useConsolidation() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSites() {
    if (!user) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from("user_mama_access")
      .select("mamas(id, nom)")
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      setError(error.message || String(error));
      setSites([]);
      return [];
    }
    const rows = (data || []).map((r) => ({ id: r.mamas.id, nom: r.mamas.nom }));
    setSites(rows);
    setError(null);
    return rows;
  }

  async function fetchConsoMensuelle({ mamaIds = [], start, end }) {
    if (!mamaIds || mamaIds.length === 0) {
      setData([]);
      return [];
    }
    setLoading(true);
    let query = supabase
      .from("v_consolidation_mensuelle")
      .select("*")
      .in("mama_id", mamaIds);
    if (start) query = query.gte("mois", start);
    if (end) query = query.lte("mois", end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || String(error));
      setData([]);
      return [];
    }
    setError(null);
    setData(Array.isArray(data) ? data : []);
    return data || [];
  }

  function getKpis(rows) {
    const base = rows || data;
    const kpis = {
      ca: 0,
      achats: 0,
      foodcost: 0,
      margeCarte: null,
      ecarts: 0,
    };
    if (!base || base.length === 0) return kpis;
    let totalMarge = 0;
    let countMarge = 0;
    for (const r of base) {
      kpis.ca += Number(r.ca_total || 0);
      kpis.achats += Number(r.achats_total || 0);
      kpis.foodcost += Number(r.menu_foodcost_total || 0);
      kpis.ecarts += Number(r.ecart_valorise_total || 0);
      if (r.marge_pct_moy !== null && r.marge_pct_moy !== undefined) {
        totalMarge += Number(r.marge_pct_moy);
        countMarge += 1;
      }
    }
    kpis.margeCarte = countMarge ? totalMarge / countMarge : null;
    return kpis;
  }

  function exportExcel(rows) {
    const dataset = rows || data;
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(dataset),
        "Consolidation"
      );
      XLSX.writeFile(wb, "consolidation.xlsx");
    });
  }

  function exportPdf() {
    // Placeholder: implementation can be added later
    console.info("PDF export not implemented");
  }

  return {
    sites,
    data,
    loading,
    error,
    fetchSites,
    fetchConsoMensuelle,
    exportExcel,
    exportPdf,
    getKpis,
  };
}

export default useConsolidation;
