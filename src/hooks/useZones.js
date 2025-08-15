// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export function useZones() {
  const { mama_id } = useAuth();
  const [zones, setZones] = useState([]);

  async function fetchZones({ q, type, actif } = {}) {
    let query = supabase
      .from('zones_stock')
      .select('id, nom, type, parent_id, position, actif, created_at')
      .eq('mama_id', mama_id)
      .order('position', { ascending: true })
      .order('nom');
    if (q) query = query.ilike('nom', `%${q}%`);
    if (type) query = query.eq('type', type);
    if (actif !== undefined) query = query.eq('actif', actif);
    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      return [];
    }
    const cleaned = (data || []).map(z => ({
      ...z,
      position: Number.isFinite(z.position) ? z.position : 0,
    }));
    cleaned.sort((a, b) => a.position - b.position || a.nom.localeCompare(b.nom));
    setZones(cleaned);
    return cleaned;
  }

  async function fetchZoneById(id) {
    const { data, error } = await supabase
      .from('zones_stock')
      .select('id, nom, type, parent_id, position, actif, created_at')
      .eq('id', id)
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    return {
      ...data,
      position: Number.isFinite(data.position) ? data.position : 0,
    };
  }

  async function createZone(payload) {
    const { error } = await supabase
      .from('zones_stock')
      .insert([{ ...payload, mama_id }]);
    if (error) toast.error(error.message);
    return { error };
  }

  async function updateZone(id, payload) {
    const { error } = await supabase
      .from('zones_stock')
      .update(payload)
      .eq('id', id);
    if (error) toast.error(error.message);
    return { error };
  }

  async function deleteZone(id) {
    const { error } = await supabase
      .from('zones_stock')
      .delete()
      .eq('id', id);
    if (error) toast.error(error.message);
    return { error };
  }

  async function reorderZones(list) {
    const updates = list.map((z, idx) => ({ id: z.id, position: idx }));
    const { error } = await supabase
      .from('zones_stock')
      .upsert(updates);
    if (error) toast.error(error.message);
    return { error };
  }

  async function myAccessibleZones({ mode } = {}) {
    const { data: { user } = {} } = await supabase.auth.getUser();
    let query = supabase
      .from('zones_stock')
      .select('*, zones_droits!inner(*)')
      .eq('zones_droits.user_id', user?.id || null)
      .eq('actif', true);
    if (mode) query = query.eq(`zones_droits.${mode}`, true);
    if (mode === 'requisition') query = query.in('type', ['cave', 'shop']);
    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      return [];
    }
    return data?.map(z => ({ ...z, ...z.zones_droits })) || [];
  }

  return {
    zones,
    fetchZones,
    fetchZoneById,
    createZone,
    updateZone,
    deleteZone,
    reorderZones,
    myAccessibleZones,
  };
}

