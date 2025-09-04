// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useEcartsInventaire() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEcarts = useCallback(async (filters = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("v_ecarts_inventaire")
      .select("*")
      .eq("mama_id", mama_id);
    if (filters.date_start) query = query.gte("date", filters.date_start);
    if (filters.date_end) query = query.lte("date", filters.date_end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      setData([]);
      return [];
    }
    setData(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  return { data, loading, error, fetchEcarts };
}

export default useEcartsInventaire;
