// src/hooks/useRoles.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useRoles() {
  const { mama_id, role } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("roles").select("*");

      if (role !== "superadmin") {
        query = query.eq("mama_id", mama_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error("❌ Erreur chargement rôles :", err.message);
      setError(err.message);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mama_id || role === "superadmin") fetchRoles();
  }, [mama_id, role]);

  return { roles, loading, error, refetch: fetchRoles };
}

export default useRoles;
