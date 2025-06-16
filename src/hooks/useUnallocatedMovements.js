import { supabase } from "@/lib/supabase";

export function useUnallocatedMovements() {

  async function fetchUnallocated({ limit = 100 } = {}) {
    const { data, error } = await supabase.rpc('mouvements_without_alloc', { limit_param: limit });
    if (error) {
      console.error('fetchUnallocated', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  return { fetchUnallocated };
}
