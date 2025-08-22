// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useZoneProducts() {
  const { mama_id } = useAuth();

  async function list(zoneId) {
    const { data, error } = await supabase
      .from('v_produits_par_zone')
      .select('*')
      .eq('zone_id', zoneId);
    if (error) {
      if (error.code === '42P01') {
        const { data: fallback, error: err2 } = await supabase
          .from('produits')
          .select('*')
          .eq('zone_id', zoneId);
        if (err2) {
          toast.error(err2.message);
          return [];
        }
        return fallback || [];
      }
      toast.error(error.message);
      return [];
    }
    return data || [];
  }

  async function move(srcZoneId, dstZoneId, keepQuantities = true) {
    const { error } = await supabase.rpc('move_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dst_zone: dstZoneId,
      p_keep_quantities: keepQuantities,
    });
    if (error) toast.error(error.message);
    return { error };
  }

  async function copy(srcZoneId, dstZoneId, withQuantities = false) {
    const { error } = await supabase.rpc('copy_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dst_zone: dstZoneId,
      p_with_quantities: withQuantities,
    });
    if (error) toast.error(error.message);
    return { error };
  }

  async function merge(srcZoneId, dstZoneId) {
    const { error } = await supabase.rpc('merge_zone_products', {
      p_mama: mama_id,
      p_src_zone: srcZoneId,
      p_dst_zone: dstZoneId,
    });
    if (error) toast.error(error.message);
    return { error };
  }

  async function unlink(zoneId, produitId) {
    const { error } = await supabase
      .from('produits_zones')
      .update({ actif: false })
      .eq('zone_id', zoneId)
      .eq('produit_id', produitId)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    return { error };
  }

  async function setMin(zoneId, produitId, stock_min) {
    const { error } = await supabase
      .from('produits_zones')
      .update({ stock_min })
      .eq('zone_id', zoneId)
      .eq('produit_id', produitId)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    return { error };
  }

  async function setStock(zoneId, produitId, stock_reel) {
    const { error } = await supabase
      .from('produits_zones')
      .update({ stock_reel })
      .eq('zone_id', zoneId)
      .eq('produit_id', produitId)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    return { error };
  }

  async function setDefault(zoneId, produitId) {
    const { error } = await supabase
      .from('produits')
      .update({ zone_id: zoneId })
      .eq('id', produitId)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    return { error };
  }

  return { list, move, copy, merge, unlink, setMin, setStock, setDefault };
}
