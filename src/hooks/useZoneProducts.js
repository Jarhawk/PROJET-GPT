// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';

import { useAuth } from '@/hooks/useAuth';

export function useZoneProducts() {
  const { mama_id } = useAuth();

  async function list(zoneId) {
    let q = supabase.
    from('v_produits_par_zone').
    select('*').
    eq('zone_id', zoneId).
    eq('mama_id', mama_id);
    let { data, error } = await q;
    if (error) {
      ({ data, error } = await supabase.
      from('produits').
      select('*').
      eq('zone_id', zoneId).
      eq('mama_id', mama_id));
    }
    if (error) throw error;
    return data;
  }

  async function move(srcZoneId, dstZoneId, removeSrc) {
    return await supabase.rpc('move_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dest_zone: dstZoneId,
      p_remove_src: removeSrc
    });
  }

  async function copy(srcZoneId, dstZoneId, overwrite) {
    return await supabase.rpc('copy_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dest_zone: dstZoneId,
      p_overwrite: overwrite
    });
  }

  async function merge(srcZoneId, dstZoneId) {
    return await supabase.rpc('merge_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dest_zone: dstZoneId
    });
  }

  return { list, move, copy, merge };
}