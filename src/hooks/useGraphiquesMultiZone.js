// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useGraphiquesMultiZone() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Exemple : récupère les évolutions par zone pour graphiques
  async function fetchGraphiquesMultiZone() {
    setLoading(true);
    setError(null);
    try {
      const { data: zones, error } = await supabase
        .from("zones_stock")
        .select("id, nom");

      if (error) throw error;

      let allData = [];
      for (const zone of zones || []) {
        const { data: inventaires, error: errorInv } = await supabase
          .from("inventaires")
          .select("date")
          .eq("mama_id", mama_id)
          .eq("zone", zone.nom)
          .order("date_inventaire", { ascending: true });

        if (errorInv) throw errorInv;

          allData.push({
            zone: zone.nom,
            points: (inventaires || []).map(inv => ({
              date: inv.date_inventaire,
            })),
          });
      }
      setData(allData);
    } catch (err) {
      setError(err.message || "Erreur chargement graphiques multi-zone.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, fetchGraphiquesMultiZone };
}
