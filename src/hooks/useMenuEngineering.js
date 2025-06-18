import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useMenuEngineering() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);

  const fetchData = useCallback(async (periode) => {
    if (!mama_id) return [];
    const { data: fiches } = await supabase
      .from('fiches_techniques')
      .select('*')
      .eq('mama_id', mama_id)
      .eq('carte_actuelle', true)
      .order('nom');
    const { data: ventes } = await supabase
      .from('ventes_fiches_carte')
      .select('fiche_id, ventes')
      .eq('mama_id', mama_id)
      .eq('periode', periode);
    const vMap = {};
    (ventes || []).forEach(v => { vMap[v.fiche_id] = v.ventes; });
    const rows = (fiches || []).map(f => {
      const cout = f.cout_portion ?? f.cout_par_portion;
      return {
        ...f,
        ventes: vMap[f.id] || 0,
        foodCost: f.prix_vente && cout ? (cout / f.prix_vente) * 100 : null
      };
    });
    setData(rows);
    return rows;
  }, [mama_id]);

  const saveVente = useCallback(async (fiche_id, periode, ventes) => {
    const { data: existing } = await supabase
      .from('ventes_fiches_carte')
      .select('id')
      .eq('fiche_id', fiche_id)
      .eq('periode', periode)
      .eq('mama_id', mama_id)
      .maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase
        .from('ventes_fiches_carte')
        .update({ ventes })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('ventes_fiches_carte')
        .insert({ fiche_id, periode, ventes, mama_id }));
    }
    if (error) throw error;
  }, [mama_id]);

  return { data, fetchData, saveVente };
}
