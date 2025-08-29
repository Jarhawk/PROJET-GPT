// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
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
      let { data: zones, error } = await supabase
        .from('zones_stock')
        .select('id,nom,type,parent_id,position,actif,created_at')
        .eq('mama_id', mama_id)
        .order('position', { ascending: true })
        .order('nom', { ascending: true });

      if (error) {
        console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
        const alt = await supabase
          .from('zones_stock')
          .select('id,nom,type,parent_id,position,actif,created_at')
          .eq('mama_id', mama_id);
        zones = alt.data ?? [];
      }

      const zoneList = Array.isArray(zones) ? zones : [];
      const allData = [];

      for (const zone of zoneList) {
        const { data: inventaires, error: errorInv } = await supabase
          .from('inventaires')
          .select('date:date_inventaire')
          .eq('mama_id', mama_id)
          .eq('zone', zone.nom)
          .order('date_inventaire', { ascending: true });

        if (errorInv) throw errorInv;

        const invRows = Array.isArray(inventaires) ? inventaires : [];
        const points = [];
        for (const inv of invRows) {
          points.push({ date: inv.date });
        }

        allData.push({
          zone: zone.nom,
          points,
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
