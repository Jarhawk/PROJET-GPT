// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useReporting() {
  const { mama_id } = useAuth();

  // Applique uniquement les filtres existant dans les vues utilisées
  const applyFilters = (query, filters = {}) => {
    if (filters.date_start) query = query.gte("date", filters.date_start);
    if (filters.date_end) query = query.lte("date", filters.date_end);
    if (filters.famille) query = query.eq("famille", filters.famille);
    if (filters.cost_center) query = query.eq("cost_center_id", filters.cost_center);
    return query;
  };

  async function getIndicators() {
    if (!mama_id) return {};
    const { data, error } = await supabase.rpc('consolidated_stats');
    if (error) {
      console.error('getIndicators', error);
      return {};
    }
    return Array.isArray(data) && data.length > 0 ? data[0] : {};
  }

  async function getGraphData(type, filters = {}) {
    if (!mama_id) return [];
    let query;
    switch (type) {
      case 'achats':
        query = supabase.from('v_achats_mensuels').select('*').eq('mama_id', mama_id);
        query = applyFilters(query, filters);
        break;
      case 'pmp':
        query = supabase.from('v_pmp').select('*').eq('mama_id', mama_id);
        break;
      case 'familles':
        query = supabase
          .from('v_analytique_stock')
          .select('famille, sumv:valeur')
          .eq('mama_id', mama_id)
          .group('famille');
        query = applyFilters(query, filters);
        break;
      case 'cost_center':
        query = supabase.from('v_cost_center_month').select('*').eq('mama_id', mama_id);
        if (filters.date_start) query = query.gte('mois', filters.date_start);
        if (filters.date_end) query = query.lte('mois', filters.date_end);
        break;
      default:
        return [];
    }
    const { data, error } = await query;
    if (error) {
      console.error("getGraphData", error);
      return [];
    }
    return data || [];
  }

  async function getEcartInventaire(filters = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from('v_analytique_stock')
      .select('produit_id, sumv:valeur')
      .eq('mama_id', mama_id)
      .group('produit_id');
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) {
      console.error('getEcartInventaire', error);
      return [];
    }
    return data || [];
  }

  async function getCostCenterBreakdown(filters = {}) {
    if (!mama_id) return [];
    let query = supabase.from("v_cost_center_month").select("*").eq("mama_id", mama_id);
    if (filters.date_start) query = query.gte("mois", filters.date_start);
    if (filters.date_end) query = query.lte("mois", filters.date_end);
    const { data, error } = await query;
    if (error) {
      console.error("getCostCenterBreakdown", error);
      return [];
    }
    return data || [];
  }

  return { getIndicators, getGraphData, getEcartInventaire, getCostCenterBreakdown };
}

export default useReporting;
