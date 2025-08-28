// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useZoneProducts() {
  const { mama_id } = useAuth();

  async function list(zoneId) {
    if (!mama_id || !zoneId) return [];
    const { data, error } = await supabase
      .from('produits')
      .select('id, nom, unite_id, stock_reel, stock_min')
      .eq('zone_stock_id', zoneId)
      .eq('mama_id', mama_id)
      .order('nom', { ascending: true });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows.map(p => ({
      id: p.id,
      produit_id: p.id,
      produit_nom: p.nom,
      unite_id: p.unite_id,
      stock_reel: p.stock_reel,
      stock_min: p.stock_min,
    }));
  }

  async function move(srcZoneId, dstZoneId, removeSrc) {
    if (!mama_id || !srcZoneId || !dstZoneId) return { error: null };
    const { error } = await supabase.rpc('move_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dest_zone: dstZoneId,
      p_remove_src: !!removeSrc,
    });
    return { error };
  }

  async function copy(srcZoneId, dstZoneId, overwrite = false) {
    if (!mama_id || !srcZoneId || !dstZoneId) return { error: null };
    const { error } = await supabase.rpc('copy_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dest_zone: dstZoneId,
      p_overwrite: !!overwrite,
    });
    return { error };
  }

  async function merge(srcZoneId, dstZoneId) {
    if (!mama_id || !srcZoneId || !dstZoneId) return { error: null };
    const { error } = await supabase.rpc('merge_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dest_zone: dstZoneId,
    });
    return { error };
  }

  async function setDefault(zoneId, prodId) {
    return await supabase
      .from('produits')
      .update({ zone_stock_id: zoneId })
      .eq('id', prodId)
      .eq('mama_id', mama_id);
  }

  return { list, move, copy, merge, setDefault };
}
