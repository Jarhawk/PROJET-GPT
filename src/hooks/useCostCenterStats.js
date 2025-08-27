// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useCostCenterStats() {
  const { mama_id } = useAuth();

  async function fetchStats() {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from('v_mouvements_centres_cout_stats')
      .select('centre_cout_id, centre_cout, total_quantite, total_valeur');
    if (error) {
      console.error('Erreur v_mouvements_centres_cout_stats:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  return { fetchStats };
}
