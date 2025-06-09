// ✅ src/hooks/useInventaires.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useInventaires = ({ mama_id: mamaIdProp } = {}) => {
  const { mama_id } = useAuth();
  const activeMamaId = mamaIdProp || mama_id;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventaires = useCallback(async () => {
    if (!activeMamaId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("inventaires")
      .select("*")
      .eq("mama_id", activeMamaId)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Erreur chargement inventaires:", error);
      setError(error);
    } else {
      setData(data || []);
    }

    setLoading(false);
  }, [activeMamaId]);

  useEffect(() => {
    fetchInventaires();
  }, [fetchInventaires]);

  return { data, loading, error, fetchInventaires };
};

export default useInventaires;
