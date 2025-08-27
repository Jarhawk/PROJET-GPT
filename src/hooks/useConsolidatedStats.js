// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';

export function useConsolidatedStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchStats() {
    setLoading(true);
    const { data, error } = await supabase
      .from('v_mouvements_centres_cout_stats')
      .select('centre_cout_id, centre_cout, total_quantite, total_valeur');
    setLoading(false);
    if (error) {
      console.error('Erreur v_mouvements_centres_cout_stats:', error);
      setError(error.message || error);
      setStats([]);
      return [];
    }
    setStats(Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  }

  return { stats, loading, error, fetchStats };
}
