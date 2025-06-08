// ✅ src/hooks/useInventaires.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const useInventaires = ({ mama_id }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventaires = useCallback(async () => {
    if (!mama_id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("inventaires")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Erreur chargement inventaires:", error);
      setError(error);
    } else {
      setData(data || []);
    }

    setLoading(false);
  }, [mama_id]);

  useEffect(() => {
    if (mama_id) {
      fetchInventaires();
    }
  }, [mama_id, fetchInventaires]);

  return { data, loading, error, fetchInventaires };
};

export default useInventaires;
