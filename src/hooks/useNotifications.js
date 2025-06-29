// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function useNotifications() {
  const { mama_id, user_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendToast = useCallback((message, type = "info") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast(message);
  }, []);

  const createNotification = useCallback(
    async ({ titre, texte, lien, user_id: targetUser, type = "info" }) => {
      if (!mama_id) return { error: "missing mama_id" };
      const { error } = await supabase.from("notifications").insert([
        {
          mama_id,
          user_id: targetUser || user_id,
          titre,
          texte,
          lien,
          type,
        },
      ]);
      if (error) return { error };
      return { data: true };
    },
    [mama_id, user_id]
  );

  const sendEmailNotification = useCallback(async (template, params) => {
    const { data, error } = await supabase.rpc("send_email_notification", {
      template,
      params,
    });
    return { data, error };
  }, []);

  const sendWebhook = useCallback(async (payload) => {
    const { data, error } = await supabase.rpc("send_notification_webhook", {
      payload,
    });
    return { data, error };
  }, []);

  const fetchNotifications = useCallback(
    async ({ type = "" } = {}) => {
      if (!mama_id || !user_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("mama_id", mama_id)
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      setLoading(false);
      if (error) {
        setError(error.message || error);
        setItems([]);
        return [];
      }
      setItems(Array.isArray(data) ? data : []);
      return data || [];
    },
    [mama_id, user_id]
  );

  const markAsRead = useCallback(
    async (id) => {
      if (!mama_id || !user_id || !id) return;
      await supabase
        .from("notifications")
        .update({ lu: true })
        .eq("id", id)
        .eq("mama_id", mama_id)
        .eq("user_id", user_id);
      setItems((ns) => ns.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    },
    [mama_id, user_id]
  );


  return {
    items,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    sendToast,
    createNotification,
    sendEmailNotification,
    sendWebhook,
  };
}
