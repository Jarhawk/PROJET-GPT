// ✅ src/hooks/useUtilisateurs.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useUtilisateurs() {
  const { mama_id } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUtilisateurs = async ({ page = 1, actifOnly = true, search = "" }) => {
    if (!mama_id) return;

    setLoading(true);
    const pageSize = 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("users")
      .select("id, email, role, actif", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("email", { ascending: true })
      .range(from, to);

    if (actifOnly) {
      query = query.eq("actif", true);
    }

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("❌ Erreur chargement utilisateurs:", error);
      setUtilisateurs([]);
      setTotalPages(1);
    } else {
      setUtilisateurs(data || []);
      setTotalPages(Math.ceil((count || 1) / pageSize));
    }

    setLoading(false);
  };

  return { utilisateurs, loading, totalPages, fetchUtilisateurs };
}
