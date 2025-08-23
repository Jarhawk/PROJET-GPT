// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useState } from 'react';

export function useZones() {
  const { mama_id } = useAuth();
  const [zones, setZones] = useState([]);

  async function fetchZones({ q, type, actif } = {}) {
    let query = supabase
      .from('zones')
      .select('id, nom, type, parent_id, position, actif, created_at')
      .order('position', { ascending: true })
      .order('nom');
    if (q) query = query.ilike('nom', `%${q}%`);
    if (type) query = query.eq('type', type);
    if (actif !== undefined) query = query.eq('actif', actif);
    let { data, error } = await query;
    if (error) {
      console.info('[zones] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
      const alt = await supabase
        .from('zones')
        .select('id, nom, type, parent_id, position, actif, created_at');
      data = alt.data ?? [];
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
    let { data, error } = await supabase
      .from('zones_stock')
      .select('id, nom, type, parent_id, position, actif, created_at')
      .eq('mama_id', mama_id)
      .eq('id', id)
      .single();
    if (error) {
      console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
      const alt = await supabase
        .from('zones_stock')
        .select('id, nom, type, parent_id, position, actif, created_at')
        .eq('mama_id', mama_id)
        .eq('id', id)
        .single();
      data = alt.data || null;
    }
    if (!data) return null;
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
      .select('id, nom, type, parent_id, position, actif, created_at, zones_droits!inner(*)')
      .eq('mama_id', mama_id)
      .eq('zones_droits.user_id', user?.id || null)
      .eq('actif', true)
      .order('position', { ascending: true })
      .order('nom', { ascending: true });
    if (mode) query = query.eq(`zones_droits.${mode}`, true);
    if (mode === 'requisition') query = query.in('type', ['cave', 'shop']);
    let { data, error } = await query;
    if (error) {
      console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
      const alt = await supabase
        .from('zones_stock')
        .select('id, nom, type, parent_id, position, actif, created_at, zones_droits!inner(*)')
        .eq('mama_id', mama_id)
        .eq('zones_droits.user_id', user?.id || null)
        .eq('actif', true);
      data = alt.data ?? [];
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

