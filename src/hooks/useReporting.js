// ✅ src/hooks/useReporting.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useReporting = (periode) => {
  const { mama_id } = useAuth();
  const [stats, setStats] = useState({
    reel: 0,
    theorique: 0,
    ecart: 0,
    pourcent: 0,
    detail: [],
  });

  useEffect(() => {
    const fetchReporting = async () => {
      if (!periode || !mama_id) return;

      const start = `${periode}-01`;
      const end = `${periode}-31`;

      try {
        // ✅ Quantité réelle issue des mouvements d'inventaire
        const { data: reelData, error: reelError } = await supabase
          .from("stocks")
          .select("quantite, zone")
          .eq("mama_id", mama_id)
          .eq("type", "inventaire")
          .gte("date", start)
          .lte("date", end);

        // ✅ Quantité théorique issue des achats - sorties
        const { data: theoData, error: theoError } = await supabase
          .from("stocks")
          .select("quantite, type, zone")
          .eq("mama_id", mama_id)
          .gte("date", start)
          .lte("date", end);

        if (reelError || theoError) {
          console.error("Erreur reporting :", reelError || theoError);
          return;
        }

        const totalReel = reelData?.reduce((sum, r) => sum + (r.quantite || 0), 0) || 0;

        const achats = theoData?.filter((s) => s.type === "achat") || [];
        const sorties = theoData?.filter((s) => s.type === "sortie") || [];

        const totalAchats = achats.reduce((sum, a) => sum + (a.quantite || 0), 0);
        const totalSorties = sorties.reduce((sum, s) => sum + (s.quantite || 0), 0);
        const totalTheorique = totalAchats - totalSorties;

        const ecart = totalReel - totalTheorique;
        const pourcent = totalTheorique !== 0 ? ((ecart / totalTheorique) * 100).toFixed(1) : 0;

        // Répartition par zone (bar / cuisine / autre)
        const zones = {};
        for (const r of reelData || []) {
          zones[r.zone] = (zones[r.zone] || 0) + (r.quantite || 0);
        }

        const detail = Object.entries(zones).map(([nom, valeur]) => ({
          nom,
          valeur,
        }));

        setStats({
          reel: totalReel,
          theorique: totalTheorique,
          ecart,
          pourcent,
          detail,
        });
      } catch (e) {
        console.error("❌ Erreur reporting :", e);
      }
    };

    fetchReporting();
  }, [periode, mama_id]);

  return { stats };
};

export default useReporting;
