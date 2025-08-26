// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import JSPDF from "jspdf";
import "jspdf-autotable";

export function useConsolidation() {
  const [sites, setSites] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { mama_id: currentMamaId, role } = useAuth();

  // Liste des sites accessibles par l'utilisateur
  const fetchSites = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('mamas').select('id, nom');
    if (role !== 'superadmin') query = query.eq('id', currentMamaId);
    const { data, error } = await query.order('nom', { ascending: true });
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setSites([]);
      return [];
    }
    const list = (data || []).map((m) => ({ mama_id: m.id, role }));
    setError(null);
    setSites(list);
    return list;
  }, [currentMamaId, role]);

  // Vue consolidation mensuelle
  const fetchConsoMensuelle = useCallback(
    async ({ mamaIds = [], start, end } = {}) => {
      setLoading(true);
      let query = supabase
        .from('v_achats_mensuels')
        .select('mama_id, mois, achats_total:montant_total');
      if (mamaIds.length) query = query.in('mama_id', mamaIds);
      else if (currentMamaId) query = query.eq('mama_id', currentMamaId);
      if (start) query = query.gte('mois', start);
      if (end) query = query.lte('mois', end);
      const { data, error } = await query;
      setLoading(false);
      if (error) {
        setError(error.message || error);
        setRows([]);
        return [];
      }
      const list = (data || []).map((r) => ({
        ...r,
        ca_total: 0,
        menu_foodcost_total: 0,
        marge_pct_moy: 0,
        ecart_valorise_total: 0,
      }));
      setError(null);
      setRows(list);
      return list;
    },
    [currentMamaId]
  );

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
    exportExcel,
    exportPdf,
    getKpis,
  };
}

export default useConsolidation;
