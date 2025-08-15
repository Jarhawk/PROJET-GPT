// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useUsageStats() {
  const { mama_id } = useAuth();

  async function getModuleUsageCount() {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("usage_stats")
      .select("module, count:id")
      .eq("mama_id", mama_id)
      .group("module");
    if (error) return [];
    return data || [];
  }

  async function getLastSeen(user_id) {
    if (!mama_id || !user_id) return null;
    const { data } = await supabase
      .from("usage_stats")
      .select("timestamp")
      .eq("mama_id", mama_id)
      .eq("user_id", user_id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();
    return data?.timestamp || null;
  }

  async function getFrequentErrors() {
    if (!mama_id) return [];
    const { data } = await supabase
      .from("logs_securite")
      .select("description, count:id")
      .eq("mama_id", mama_id)
      .ilike("type", "%erreur%")
      .group("description")
      .order("count", { ascending: false })
      .limit(5);
    return data || [];
  }

  return { getModuleUsageCount, getLastSeen, getFrequentErrors };
}
