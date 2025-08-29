// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useStats.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useStats() {
  const { mama_id } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const queries = [
      supabase.from("produits").select("id").eq("mama_id", mama_id),
      supabase.from("fiches_techniques").select("cout_total").eq("mama_id", mama_id),
      supabase
        .from("requisition_lignes")
        .select("quantite, requisitions!inner(mama_id, statut)")
        .eq("mama_id", mama_id)
        .eq("requisitions.mama_id", mama_id)
        .eq("requisitions.statut", "réalisée"),
    ];

    const [products, fiches, mouvements] = await Promise.all(queries);

    const prodRows = Array.isArray(products.data) ? products.data : [];
    const ficheRows = Array.isArray(fiches.data) ? fiches.data : [];
    const mouvRows = Array.isArray(mouvements.data) ? mouvements.data : [];

    setStats({
      totalProduits: prodRows.length,
      totalFiches: ficheRows.length,
      coutTotalFiches: ficheRows.reduce((a, f) => a + (f.cout_total || 0), 0),
      mouvementsTotal: mouvRows.reduce((a, m) => a + (m.quantite || 0), 0),
    });

    setLoading(false);
  }, [mama_id]);

  useEffect(() => {
    if (mama_id) fetchStats();
  }, [mama_id, fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
