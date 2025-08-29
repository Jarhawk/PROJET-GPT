// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useDashboards() {
  const { user_id, mama_id } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDashboards = useCallback(async () => {
    if (!user_id || !mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("tableaux_de_bord")
      .select("id, nom, created_at, utilisateur_id, mama_id, widgets:gadgets!tableau_id(id, tableau_id, type, config, created_at, mama_id, actif, nom, ordre, configuration_json)")
      .eq("utilisateur_id", user_id)
      .eq("mama_id", mama_id)
      .eq("gadgets.mama_id", mama_id)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      console.warn('[gadgets] vue manquante ou colonne absente:', error?.message || error);
      setError(error.message || error);
      setDashboards([]);
      return [];
    }
    const rows = [];
    if (Array.isArray(data)) {
      for (const d of data) {
        const widgets = Array.isArray(d.widgets) ? d.widgets : [];
        rows.push({ ...d, widgets });
      }
    }
    setDashboards(rows);
    return rows;
  }, [user_id, mama_id]);

  async function createDashboard(nom) {
    if (!user_id || !mama_id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("tableaux_de_bord")
      .insert([{ nom, utilisateur_id: user_id, mama_id }])
      .select("id, nom, created_at, utilisateur_id, mama_id")
      .single();
    setLoading(false);
    if (error) {
      console.warn('[gadgets] vue manquante ou colonne absente:', error?.message || error);
      setError(error.message || error);
      return null;
    }
    setDashboards((d) => [...d, { ...data, widgets: [] }]);
    return data;
  }

  async function addWidget(dashboardId, config) {
    if (!dashboardId) return null;
    setLoading(true);
    setError(null);
    const { data: ordreData } = await supabase
      .from("gadgets")
      .select("ordre")
      .eq("tableau_id", dashboardId)
      .eq("mama_id", mama_id)
      .order("ordre", { ascending: false })
      .limit(1)
      .single();
    const ordre = ordreData ? (ordreData.ordre || 0) + 1 : 0;
    const { data, error } = await supabase
      .from("gadgets")
      .insert([{ tableau_id: dashboardId, config, ordre, mama_id }])
      .select("id, tableau_id, type, config, created_at, mama_id, actif, nom, ordre, configuration_json")
      .single();
    setLoading(false);
    if (error) {
      console.warn('[gadgets] vue manquante ou colonne absente:', error?.message || error);
      setError(error.message || error);
      return null;
    }
    setDashboards((ds) => {
      const list = Array.isArray(ds) ? ds : [];
      const next = [];
      for (const db of list) {
        if (db.id === dashboardId) {
          const widgets = Array.isArray(db.widgets) ? [...db.widgets, data] : [data];
          next.push({ ...db, widgets });
        } else {
          next.push(db);
        }
      }
      return next;
    });
    return data;
  }

  async function updateWidget(dashboardId, id, values) {
    if (!dashboardId || !id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("gadgets")
      .update(values)
      .eq("id", id)
      .eq("tableau_id", dashboardId)
      .eq("mama_id", mama_id)
      .select("id, tableau_id, type, config, created_at, mama_id, actif, nom, ordre, configuration_json")
      .single();
    setLoading(false);
    if (error) {
      console.warn('[gadgets] vue manquante ou colonne absente:', error?.message || error);
      setError(error.message || error);
      return null;
    }
    setDashboards((ds) => {
      const list = Array.isArray(ds) ? ds : [];
      const next = [];
      for (const db of list) {
        if (db.id === dashboardId) {
          const widgetsList = Array.isArray(db.widgets) ? db.widgets : [];
          const updated = [];
          for (const w of widgetsList) {
            updated.push(w.id === id ? data : w);
          }
          next.push({ ...db, widgets: updated });
        } else {
          next.push(db);
        }
      }
      return next;
    });
    return data;
  }

  async function deleteWidget(dashboardId, id) {
    if (!dashboardId || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("gadgets")
      .delete()
      .eq("id", id)
      .eq("tableau_id", dashboardId)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      console.warn('[gadgets] vue manquante ou colonne absente:', error?.message || error);
      setError(error.message || error);
      return;
    }
    setDashboards((ds) => {
      const list = Array.isArray(ds) ? ds : [];
      const next = [];
      for (const db of list) {
        if (db.id === dashboardId) {
          const widgetsList = Array.isArray(db.widgets) ? db.widgets : [];
          const remaining = [];
          for (const w of widgetsList) {
            if (w.id !== id) remaining.push(w);
          }
          next.push({ ...db, widgets: remaining });
        } else {
          next.push(db);
        }
      }
      return next;
    });
  }

  return {
    dashboards,
    loading,
    error,
    getDashboards,
    createDashboard,
    addWidget,
    updateWidget,
    deleteWidget,
  };
}
