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
        .from('zones_stock')
        .select('id, nom, type, parent_id, position, actif, created_at')
        .eq('mama_id', mama_id)
        .order('position', { ascending: true })
        .order('nom');
      if (q) query = query.ilike('nom', `%${q}%`);
      if (type) query = query.eq('type', type);
      if (actif !== undefined) query = query.eq('actif', actif);
      let { data, error } = await query;
      if (error) {
        console.info('[zones_stock] fetch failed; fallback list (no order)', { code: error.code, message: error.message });
        const alt = await supabase
          .from('zones_stock')
          .select('id, nom, type, parent_id, position, actif, created_at')
          .eq('mama_id', mama_id);
        data = Array.isArray(alt.data) ? alt.data : [];
      }
      const arr = Array.isArray(data) ? data : [];
      const cleaned = [];
      for (const z of arr) {
        cleaned.push({
          ...z,
          position: Number.isFinite(z.position) ? z.position : 0,
        });
      }
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
        .eq('mama_id', mama_id)
        .eq('id', id);
    if (error) toast.error(error.message);
    return { error };
  }

  async function deleteZone(id) {
      const { error } = await supabase
        .from('zones_stock')
        .delete()
        .eq('mama_id', mama_id)
        .eq('id', id);
    if (error) toast.error(error.message);
    return { error };
  }

    async function reorderZones(list) {
      const arr = Array.isArray(list) ? list : [];
      const updates = [];
      let idx = 0;
      for (const z of arr) {
        updates.push({ id: z.id, position: idx, mama_id });
        idx += 1;
      }
      const { error } = await supabase.from('zones_stock').upsert(updates);
      if (error) toast.error(error.message);
      return { error };
    }

  async function myAccessibleZones({ mode } = {}) {
    const {
      data: { user } = {},
    } = await supabase.auth.getUser();

    const { data: rightsData, error: rightsError } = await supabase
      .from('zones_droits')
      .select('zone_id, lecture, ecriture, transfert, requisition')
      .eq('mama_id', mama_id)
      .eq('user_id', user?.id || null);

    if (rightsError) {
      console.info('[zones_droits] fetch failed', {
        code: rightsError.code,
        message: rightsError.message,
      });
      return [];
    }

    const rightsArr = Array.isArray(rightsData) ? rightsData : [];
    const filtered = [];
    for (const r of rightsArr) {
      if (!mode || r[mode]) filtered.push(r);
    }

    const zoneIds = [];
    for (const r of filtered) zoneIds.push(r.zone_id);

    let { data, error } = await supabase
      .from('zones_stock')
      .select('id, nom, type, parent_id, position, actif, created_at')
      .eq('mama_id', mama_id)
      .eq('actif', true)
      .in('id', zoneIds)
      .order('position', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      console.info('[zones_stock] fetch failed; fallback list (no order)', {
        code: error.code,
        message: error.message,
      });
      const alt = await supabase
        .from('zones_stock')
        .select('id, nom, type, parent_id, position, actif, created_at')
        .eq('mama_id', mama_id)
        .eq('actif', true)
        .in('id', zoneIds);
      data = Array.isArray(alt.data) ? alt.data : [];
    }

    const zonesArr = Array.isArray(data) ? data : [];
    const out = [];
    for (const z of zonesArr) {
      let r = {};
      for (const rt of filtered) {
        if (rt.zone_id === z.id) {
          r = rt;
          break;
        }
      }
      out.push({ ...z, ...r });
    }

    if (mode === 'requisition') {
      const res = [];
      for (const z of out) {
        if (['cave', 'shop'].includes(z.type)) res.push(z);
      }
      return res;
    }

    return out;
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

export default useZones;

