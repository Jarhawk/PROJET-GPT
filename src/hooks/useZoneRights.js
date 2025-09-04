// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useZoneRights() {
  const { mama_id } = useAuth();

  async function fetchZoneRights(zone_id) {
    const { data, error } = await supabase
      .from('zones_droits')
      .select('*')
      .eq('zone_id', zone_id)
      .eq('mama_id', mama_id);
    if (error) {
      toast.error(error.message);
      return [];
    }
    return data || [];
  }

  async function setUserRights({ zone_id, user_id, lecture, ecriture, transfert, requisition }) {
    const { error } = await supabase
      .from('zones_droits')
      .upsert({ mama_id, zone_id, user_id, lecture, ecriture, transfert, requisition }, { onConflict: 'mama_id,zone_id,user_id' });
    if (error) toast.error(error.message);
    return { error };
  }

  async function removeUserRights(id) {
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

