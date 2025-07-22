// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useStockRequisitionne() {
  const { mama_id } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchStock() {
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
  }

  useEffect(() => {
    fetchStock();
  }, [mama_id]);

  return { stock, fetchStock, loading };
}

export default useStockRequisitionne;
