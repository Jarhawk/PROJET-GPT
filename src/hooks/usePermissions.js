// src/hooks/usePermissions.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function usePermissions({ roleId = null, userId = null }) {
  const { mama_id } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("permissions").select("*").eq("mama_id", mama_id);

      if (roleId) query = query.eq("role_id", roleId);
      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;

      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      console.error("❌ Erreur chargement permissions :", err.message);
      setError(err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mama_id) fetchPermissions();
  }, [mama_id, roleId, userId]);

  return { permissions, loading, error, refetch: fetchPermissions };
}

export default usePermissions;
