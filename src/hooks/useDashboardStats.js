// src/hooks/useDashboardStats.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useDashboardStats(periode) {
  const { mama_id } = useAuth(); // ✅ nouvelle source d'information
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!periode || !mama_id) return;

      setLoading(true);
      setError(null);

      const start = `${periode}-01`;
      const end = `${periode}-31`;

      try {
        const [
          productsRes,
          suppliersRes,
          invoicesRes,
          foodVentesRes,
          foodAchatsRes,
          boissonVentesRes,
          boissonAchatsRes,
        ] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }).eq("mama_id", mama_id),
          supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("mama_id", mama_id),
          supabase
            .from("invoices")
            .select("id", { count: "exact", head: true })
            .eq("mama_id", mama_id)
            .gte("date", start)
            .lte("date", end),
          supabase
            .from("ventes")
            .select("montant_ht")
            .eq("categorie", "food")
            .eq("mama_id", mama_id)
            .gte("date", start)
            .lte("date", end),
          supabase
            .from("stocks")
            .select("quantite")
            .eq("categorie", "food")
            .eq("type", "achat")
            .eq("mama_id", mama_id)
            .gte("date", start)
            .lte("date", end),
          supabase
            .from("ventes")
            .select("montant_ht")
            .eq("categorie", "boisson")
            .eq("mama_id", mama_id)
            .gte("date", start)
            .lte("date", end),
          supabase
            .from("stocks")
            .select("quantite")
            .eq("categorie", "boisson")
            .eq("type", "achat")
            .eq("mama_id", mama_id)
            .gte("date", start)
            .lte("date", end),
        ]);

        const foodVentes = foodVentesRes.data?.reduce((sum, v) => sum + v.montant_ht, 0) || 0;
        const foodAchats = foodAchatsRes.data?.reduce((sum, a) => sum + a.quantite, 0) || 0;
        const boissonVentes = boissonVentesRes.data?.reduce((sum, v) => sum + v.montant_ht, 0) || 0;
        const boissonAchats = boissonAchatsRes.data?.reduce((sum, a) => sum + a.quantite, 0) || 0;

        setStats({
          products: productsRes.count || 0,
          suppliers: suppliersRes.count || 0,
          invoices: invoicesRes.count || 0,
          costFood: foodVentes > 0 ? ((foodAchats / foodVentes) * 100).toFixed(1) : "0.0",
          costBoisson: boissonVentes > 0 ? ((boissonAchats / boissonVentes) * 100).toFixed(1) : "0.0",
        });
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des indicateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [periode, mama_id]);

  return { stats, loading, error };
}
