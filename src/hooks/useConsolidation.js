// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useCallback } from "react";

import * as XLSX from "xlsx";
import JSPDF from "jspdf";
import "jspdf-autotable";

export function useConsolidation() {
  const [sites, setSites] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Liste des sites accessibles par l'utilisateur
  const fetchSites = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.
    from("user_mama_access").
    select("mama_id, role");
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setSites([]);
      return [];
    }
    setError(null);
    setSites(Array.isArray(data) ? data : []);
    return data || [];
  }, []);

  // Vue consolidation mensuelle
  const fetchConsoMensuelle = useCallback(async ({ mamaIds = [], start, end } = {}) => {
    setLoading(true);
    let query = supabase.
    from("v_consolidation_mensuelle").
    select("*");
    if (mamaIds.length) query = query.in("mama_id", mamaIds);
    if (start) query = query.gte("mois", start);
    if (end) query = query.lte("mois", end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setRows([]);
      return [];
    }
    setError(null);
    setRows(Array.isArray(data) ? data : []);
    return data || [];
  }, []);

  const fetchAchats = useCallback(async (params = {}) => {
    const { mamaIds = [], start, end } = params;
    let query = supabase.from("v_cons_achats_mensuels").select("*");
    if (mamaIds.length) query = query.in("mama_id", mamaIds);
    if (start) query = query.gte("mois", start);
    if (end) query = query.lte("mois", end);
    const { data, error } = await query;
    if (error) setError(error.message || error);
    return data || [];
  }, []);

  const fetchVentes = useCallback(async (params = {}) => {
    const { mamaIds = [], start, end } = params;
    let query = supabase.from("v_cons_ventes_mensuelles").select("*");
    if (mamaIds.length) query = query.in("mama_id", mamaIds);
    if (start) query = query.gte("mois", start);
    if (end) query = query.lte("mois", end);
    const { data, error } = await query;
    if (error) setError(error.message || error);
    return data || [];
  }, []);

  const fetchFoodCost = useCallback(async (params = {}) => {
    const { mamaIds = [], start, end } = params;
    let query = supabase.from("v_cons_foodcost_mensuel").select("*");
    if (mamaIds.length) query = query.in("mama_id", mamaIds);
    if (start) query = query.gte("mois", start);
    if (end) query = query.lte("mois", end);
    const { data, error } = await query;
    if (error) setError(error.message || error);
    return data || [];
  }, []);

  const fetchEcarts = useCallback(async (params = {}) => {
    const { mamaIds = [], start, end } = params;
    let query = supabase.from("v_cons_ecarts_inventaire").select("*");
    if (mamaIds.length) query = query.in("mama_id", mamaIds);
    if (start) query = query.gte("mois", start);
    if (end) query = query.lte("mois", end);
    const { data, error } = await query;
    if (error) setError(error.message || error);
    return data || [];
  }, []);

  const exportExcel = useCallback((data) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Consolidation");
    XLSX.writeFile(wb, "consolidation.xlsx");
  }, []);

  const exportPdf = useCallback((data) => {
    const doc = new JSPDF();
    if (data && data.length > 0) {
      const head = [Object.keys(data[0])];
      const body = data.map((r) => Object.values(r));
      doc.autoTable({ head, body });
    }
    doc.save("consolidation.pdf");
  }, []);

  const getKpis = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return { ca: 0, achats: 0, menu_foodcost: 0, marge_pct: 0, ecarts: 0 };
    }
    const ca = data.reduce((s, r) => s + (r.ca_total || 0), 0);
    const achats = data.reduce((s, r) => s + (r.achats_total || 0), 0);
    const menu_foodcost = data.reduce((s, r) => s + (r.menu_foodcost_total || 0), 0);
    const marge_pct = data.reduce((s, r) => s + (r.marge_pct_moy || 0), 0) / data.length;
    const ecarts = data.reduce((s, r) => s + (r.ecart_valorise_total || 0), 0);
    return { ca, achats, menu_foodcost, marge_pct, ecarts };
  }, []);

  return {
    sites,
    rows,
    loading,
    error,
    fetchSites,
    fetchConsoMensuelle,
    fetchAchats,
    fetchVentes,
    fetchFoodCost,
    fetchEcarts,
    exportExcel,
    exportPdf,
    getKpis
  };
}

export default useConsolidation;