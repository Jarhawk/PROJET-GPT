// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function usePerformanceFiches() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchData() {
    if (!mama_id) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from('v_performance_fiches')
      .select('mama_id, fiche_id, nom, cout, volume, popularite')
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setData([]);
      return [];
    }
    setError(null);
    setData(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { data, loading, error, fetchData };
}
