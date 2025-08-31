// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth as useAuthContext } from '@/hooks/useAuth';

function useNotifications() {
  const { mama_id, user_id } = useAuthContext();
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
        .select(
          "id, mama_id, user_id, titre, texte, lien, type, lu, created_at, actif"
        )
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
      const rows = Array.isArray(data) ? data : [];
      setItems(rows);
      return rows;
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
      setItems((ns) => {
        const arr = Array.isArray(ns) ? ns : [];
        const updated = [];
        for (const n of arr) {
          updated.push(n.id === id ? { ...n, lu: true } : n);
        }
        return updated;
      });
    },
    [mama_id, user_id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!mama_id || !user_id) return;
    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('mama_id', mama_id)
      .eq('user_id', user_id)
      .eq('lu', false);
    setItems((ns) => {
      const arr = Array.isArray(ns) ? ns : [];
      const updated = [];
      for (const n of arr) {
        updated.push({ ...n, lu: true });
      }
      return updated;
    });
  }, [mama_id, user_id]);

  const fetchUnreadCount = useCallback(async () => {
    if (!mama_id || !user_id) return 0;
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('mama_id', mama_id)
      .eq('user_id', user_id)
      .eq('lu', false);
    return count || 0;
  }, [mama_id, user_id]);

  const fetchPreferences = useCallback(async () => {
    if (!mama_id || !user_id) return null;
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('id, utilisateur_id, mama_id, email_enabled, webhook_enabled, webhook_url, webhook_token, updated_at')
      .eq('mama_id', mama_id)
      .eq('utilisateur_id', user_id)
      .single();
    if (error) return null;
    return data || null;
  }, [mama_id, user_id]);

  const updatePreferences = useCallback(
    async (values = {}) => {
      if (!mama_id || !user_id) return { error: 'missing ids' };
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(
          { mama_id, utilisateur_id: user_id, ...values },
          { onConflict: ['utilisateur_id', 'mama_id'] }
        )
        .select(
          'id, utilisateur_id, mama_id, email_enabled, webhook_enabled, webhook_url, webhook_token, updated_at'
        )
        .single();
      return { data, error };
    },
    [mama_id, user_id]
  );

  const deleteNotification = useCallback(
    async (id) => {
      if (!mama_id || !user_id || !id) return;
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('mama_id', mama_id)
        .eq('user_id', user_id);
      setItems((ns) => {
        const arr = Array.isArray(ns) ? ns : [];
        const kept = [];
        for (const n of arr) {
          if (n.id !== id) kept.push(n);
        }
        return kept;
      });
    },
    [mama_id, user_id],
  );

  const updateNotification = useCallback(
    async (id, values = {}) => {
      if (!mama_id || !user_id || !id) return;
      const { data, error } = await supabase
        .from('notifications')
        .update(values)
        .eq('id', id)
        .eq('mama_id', mama_id)
        .eq('user_id', user_id)
        .select('id, mama_id, user_id, titre, texte, lien, type, lu, created_at, actif')
        .single();
      if (!error && data)
        setItems((ns) => {
          const arr = Array.isArray(ns) ? ns : [];
          const updated = [];
          for (const n of arr) {
            updated.push(n.id === id ? { ...n, ...data } : n);
          }
          return updated;
        });
      return { data, error };
    },
    [mama_id, user_id],
  );

  const getNotification = useCallback(
    async (id) => {
      if (!mama_id || !user_id || !id) return { data: null, error: 'missing' };
      const { data, error } = await supabase
        .from('notifications')
        .select('id, mama_id, user_id, titre, texte, lien, type, lu, created_at, actif')
        .eq('id', id)
        .eq('mama_id', mama_id)
        .eq('user_id', user_id)
        .single();
      if (!error && data) {
        setItems((ns) => {
          const arr = Array.isArray(ns) ? ns.slice() : [];
          const idx = arr.findIndex((n) => n.id === id);
          if (idx >= 0) {
            arr[idx] = data;
            return arr;
          }
          return [data, ...arr];
        });
      }
      return { data, error };
    },
    [mama_id, user_id],
  );

  const subscribeToNotifications = useCallback(
    (handler) => {
      if (!mama_id || !user_id) return () => {};
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            // RLS: restreint aux notifications de l'utilisateur courant et de sa MAMA
            filter: `mama_id=eq.${mama_id} and user_id=eq.${user_id}`,
          },
          (payload) => {
            setItems((ns) => [payload.new, ...(Array.isArray(ns) ? ns : [])]);
            if (handler) handler(payload.new);
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
    [mama_id, user_id],
  );


  return {
    items,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchUnreadCount,
    fetchPreferences,
    updatePreferences,
    updateNotification,
    getNotification,
    deleteNotification,
    subscribeToNotifications,
    sendToast,
    createNotification,
    sendEmailNotification,
    sendWebhook,
  };
}
export default useNotifications;
export { useNotifications };
