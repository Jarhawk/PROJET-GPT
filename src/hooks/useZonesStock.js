import { useEffect, useState, useCallback } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from "@/hooks/useAuth";

export async function fetchZonesForValidation(mama_id) {
  const q = supabase
    .from('zones_stock')
    .select('id,nom,type,parent_id,position,actif,created_at')
    .eq('mama_id', mama_id)
    .order('position', { ascending: true })
    .order('nom', { ascending: true });
  const { data, error } = await q;
  if (error) {
    console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
    const alt = await supabase
      .from('zones_stock')
      .select('id,nom,type,parent_id,position,actif,created_at')
      .eq('mama_id', mama_id);
    return { data: alt.data ?? [], error: null };
  }
  return { data, error: null };
}

export default function useZonesStock() {
  const { mama_id, loading: authLoading } = useAuth() || {};
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!mama_id) return;
    const fetchZones = async () => {
      let { data, error } = await supabase
        .from('zones_stock')
        .select('id,nom,type,parent_id,position,actif,created_at')
        .eq('mama_id', mama_id)
        .eq('actif', true)
        .order('position', { ascending: true })
        .order('nom', { ascending: true });
      if (error) {
        console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
        const alt = await supabase
          .from('zones_stock')
          .select('id,nom,type,parent_id,position,actif,created_at')
          .eq('mama_id', mama_id)
          .eq('actif', true);
        data = alt.data ?? [];
      }
      setZones(data || []);
      setIsLoading(false);
    };
    fetchZones();
  }, [authLoading, mama_id]);

  const suggestZones = useCallback(
    async (search = "") => {
      if (!mama_id) return [];
      let { data, error } = await supabase
        .from('zones_stock')
        .select('id,nom,type,parent_id,position,actif,created_at')
        .eq('mama_id', mama_id)
        .ilike('nom', `%${search}%`)
        .order('position', { ascending: true })
        .order('nom', { ascending: true })
        .limit(10);
      if (error) {
        console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
        const alt = await supabase
          .from('zones_stock')
          .select('id,nom,type,parent_id,position,actif,created_at')
          .eq('mama_id', mama_id)
          .ilike('nom', `%${search}%`)
          .limit(10);
        data = alt.data ?? [];
      }
      return data || [];
    },
    [mama_id]
  );

  const loading = [authLoading, isLoading].some(Boolean);

  return { zones, loading, suggestZones };
}
