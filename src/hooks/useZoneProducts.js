// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useZoneProducts() {
  const { mama_id } = useAuth();

  async function list(zoneId) {
    if (!mama_id || !zoneId) return [];
    const { data, error } = await supabase
      .from('produits')
      .select(
        'id, produit_id:id, produit_nom:nom, unite_id, stock_reel, stock_min'
      )
      .eq('zone_stock_id', zoneId)
      .eq('mama_id', mama_id)
      .order('nom', { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  async function move(srcZoneId, dstZoneId, removeSrc) {
    if (!mama_id || !srcZoneId || !dstZoneId) return { error: null };
    const { error } = await supabase
      .from('produits')
      .update({ zone_stock_id: dstZoneId })
      .eq('zone_stock_id', srcZoneId)
      .eq('mama_id', mama_id);
    // removeSrc flag kept for API compatibility; no extra handling needed
    return { error };
  }

  async function setDefault(zoneId, prodId) {
    return await supabase
      .from('produits')
      .update({ zone_stock_id: zoneId })
      .eq('id', prodId)
      .eq('mama_id', mama_id);
  }

  return { list, move, setDefault };
}
