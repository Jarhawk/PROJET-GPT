// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export function useZones() {
  const { mama_id } = useAuth();
  const [zones, setZones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchZones({ search = '', includeInactive = false, page = 1, limit = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from('zones_stock')
      .select('*', { count: 'exact' })
      .eq('mama_id', mama_id)
      .order('nom', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);
    if (!includeInactive) query = query.eq('actif', true);
    if (search) query = query.ilike('nom', `%${search}%`);
    const { data, error, count } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return [];
    }
    setZones(Array.isArray(data) ? data : []);
    setTotal(count || 0);
    return data || [];
  }

  async function addZone(nom) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    if (!nom) return { error: 'Nom requis' };
    setLoading(true);
    setError(null);
    const { data: existing } = await supabase
      .from('zones_stock')
      .select('id')
      .eq('mama_id', mama_id)
      .ilike('nom', nom);
    if (existing && existing.length > 0) {
      setLoading(false);
      const err = 'Zone déjà existante.';
      setError(err);
      toast.error(err);
      return { error: err };
    }
    const { error } = await supabase
      .from('zones_stock')
      .insert([{ nom, mama_id, actif: true }]);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return { error };
    }
    await fetchZones();
    return {};
  }

  async function updateZone(id, fields) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('zones_stock')
      .update(fields)
      .eq('id', id)
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return { error };
    }
    await fetchZones();
    return {};
  }

  async function deleteZone(id) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    setLoading(true);
    setError(null);
    const { count: reqCount } = await supabase
      .from('requisitions')
      .select('id', { count: 'exact', head: true })
      .eq('zone_id', id)
      .eq('mama_id', mama_id);
    const { count: mouvCount } = await supabase
      .from('mouvements_stock')
      .select('id', { count: 'exact', head: true })
      .or(`zone_source_id.eq.${id},zone_destination_id.eq.${id}`)
      .eq('mama_id', mama_id);
    if ((reqCount || 0) > 0 || (mouvCount || 0) > 0) {
      const err = 'Zone liée à des données, suppression impossible';
      setLoading(false);
      setError(err);
      toast.error(err);
      return { error: err };
    }
    const { error } = await supabase
      .from('zones_stock')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return { error };
    }
    await fetchZones();
    return {};
  }

  return { zones, total, loading, error, fetchZones, addZone, updateZone, deleteZone };
}
