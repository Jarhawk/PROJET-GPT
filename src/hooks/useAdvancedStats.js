// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useAdvancedStats() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { mama_id } = useAuth();

  async function fetchStats({ start, end } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    let query = supabase
      .from('v_achats_mensuels')
      .select('mois, montant_total, mama_id')
      .eq('mama_id', mama_id)
      .order('mois', { ascending: true });
    if (start) query = query.gte('mois', start);
    if (end) query = query.lte('mois', end);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setData([]);
      return [];
    }
    setData(Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  }

  return { data, loading, error, fetchStats };
}
