// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useStats.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useStats() {
  const { mama_id } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const queries = [
      supabase.from("produits").select("id").eq("mama_id", mama_id),
      supabase.from("fiches_techniques").select("cout_total").eq("mama_id", mama_id),
      supabase.from("stock_mouvements").select("quantite").eq("mama_id", mama_id),
    ];

    const [products, fiches, mouvements] = await Promise.all(queries.map((q) => q));

    setStats({
      totalProduits: products.data?.length || 0,
      totalFiches: fiches.data?.length || 0,
      coutTotalFiches: fiches.data?.reduce((a, f) => a + (f.cout_total || 0), 0) || 0,
      mouvementsTotal: mouvements.data?.reduce((a, m) => a + (m.quantite || 0), 0) || 0,
    });

    setLoading(false);
  }, [mama_id]);

  useEffect(() => {
    if (mama_id) fetchStats();
  }, [mama_id, fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
