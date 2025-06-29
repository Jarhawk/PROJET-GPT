// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
      .from("dashboards")
      .select("*, widgets:widgets(*)")
      .eq("user_id", user_id)
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setDashboards([]);
      return [];
    }
    setDashboards(Array.isArray(data) ? data : []);
    return data || [];
  }, [user_id, mama_id]);

  async function createDashboard(nom) {
    if (!user_id || !mama_id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("dashboards")
      .insert([{ nom, user_id, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
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
      .from("widgets")
      .select("ordre")
      .eq("dashboard_id", dashboardId)
      .order("ordre", { ascending: false })
      .limit(1)
      .single();
    const ordre = ordreData ? (ordreData.ordre || 0) + 1 : 0;
    const { data, error } = await supabase
      .from("widgets")
      .insert([{ dashboard_id: dashboardId, config, ordre }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return null;
    }
    setDashboards((ds) =>
      ds.map((db) =>
        db.id === dashboardId
          ? { ...db, widgets: [...(db.widgets || []), data] }
          : db
      )
    );
    return data;
  }

  async function updateWidget(dashboardId, id, values) {
    if (!dashboardId || !id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("widgets")
      .update(values)
      .eq("id", id)
      .eq("dashboard_id", dashboardId)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return null;
    }
    setDashboards((ds) =>
      ds.map((db) => ({
        ...db,
        widgets: db.widgets?.map((w) => (w.id === id ? data : w)) || [],
      }))
    );
    return data;
  }

  async function deleteWidget(dashboardId, id) {
    if (!dashboardId || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("widgets")
      .delete()
      .eq("id", id)
      .eq("dashboard_id", dashboardId);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    setDashboards((ds) =>
      ds.map((db) => ({
        ...db,
        widgets: db.widgets?.filter((w) => w.id !== id) || [],
      }))
    );
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
