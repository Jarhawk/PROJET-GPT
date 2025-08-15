// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useCallback } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useStockRequisitionne() {
  const { mama_id } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from("v_stock_requisitionne")
      .select("*")
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      console.error("❌ Erreur fetchStockRequisitionne:", error.message);
      return [];
    }
    setStock(data || []);
    return data || [];
  }, [mama_id]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  return { stock, fetchStock, loading };
}

export default useStockRequisitionne;
