// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useZoneRights() {
  const { mama_id } = useAuth();

  async function fetchZoneRights(zone_id) {
    if (!mama_id || !zone_id) return [];
    const { data, error } = await supabase
      .from('zones_droits')
      .select(
        'id, mama_id, zone_id, user_id, lecture, ecriture, transfert, requisition'
      )
      .eq('zone_id', zone_id)
      .eq('mama_id', mama_id);
    if (error) {
      toast.error(error.message);
      return [];
    }
    const rows = Array.isArray(data) ? data : [];
    return rows;
  }

  async function setUserRights({ zone_id, user_id, lecture, ecriture, transfert, requisition }) {
    if (!mama_id || !zone_id || !user_id) return { error: 'missing params' };
    const { error } = await supabase
      .from('zones_droits')
      .upsert(
        { mama_id, zone_id, user_id, lecture, ecriture, transfert, requisition },
        { onConflict: 'mama_id,zone_id,user_id' }
      );
    if (error) toast.error(error.message);
    return { error };
  }

  async function removeUserRights(id) {
    if (!mama_id || !id) return { error: 'missing params' };
    const { error } = await supabase
      .from('zones_droits')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    return { error };
  }

  return { fetchZoneRights, setUserRights, removeUserRights };
}

