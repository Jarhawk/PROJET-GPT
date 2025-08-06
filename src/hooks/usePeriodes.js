// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';

export default function usePeriodes() {
  const { mama_id } = useAuth();
  const [periodes, setPeriodes] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchPeriodes() {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('periodes_comptables')
      .select('*')
      .eq('mama_id', mama_id)
      .order('date_debut', { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setPeriodes(Array.isArray(data) ? data : []);
    setCurrent(data?.find(p => p.actuelle) || null);
    return data || [];
  }

  async function createPeriode({ date_debut, date_fin }) {
    if (!mama_id) return { error: 'no mama_id' };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('periodes_comptables')
      .insert([{ mama_id, date_debut, date_fin, cloturee: false, actuelle: true }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchPeriodes();
    return { data };
  }

  async function cloturerPeriode(id) {
    if (!mama_id) return { error: 'no mama_id' };
    setLoading(true);
    setError(null);
    const { data: periode, error: selErr } = await supabase
      .from('periodes_comptables')
      .select('*')
      .eq('id', id)
      .eq('mama_id', mama_id)
      .single();
    if (selErr || !periode) {
      setLoading(false);
      setError(selErr);
      return { error: selErr || new Error('Période introuvable') };
    }
    const { error: updErr } = await supabase
      .from('periodes_comptables')
      .update({ cloturee: true, actuelle: false })
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (updErr) {
      setLoading(false);
      setError(updErr);
      return { error: updErr };
    }
    const debut = new Date(periode.date_fin);
    debut.setDate(debut.getDate() + 1);
    const fin = new Date(debut);
    fin.setMonth(fin.getMonth() + 1);
    fin.setDate(fin.getDate() - 1);
    await supabase.from('periodes_comptables').insert([
      {
        mama_id,
        date_debut: debut.toISOString().slice(0, 10),
        date_fin: fin.toISOString().slice(0, 10),
        cloturee: false,
        actuelle: true,
      },
    ]);
    setLoading(false);
    await fetchPeriodes();
    return { data: true };
  }

  async function checkCurrentPeriode(date) {
    if (!mama_id) return { error: 'no mama_id' };
    const { data, error } = await supabase
      .from('periodes_comptables')
      .select('*')
      .eq('mama_id', mama_id)
      .eq('actuelle', true)
      .single();
    if (error) return { error };
    if (!data) return { error: new Error('Aucune période active') };
    if (data.cloturee || date < data.date_debut || date > data.date_fin)
      return { error: new Error('Période comptable clôturée') };
    return { data };
  }

  return {
    periodes,
    current,
    loading,
    error,
    fetchPeriodes,
    createPeriode,
    cloturerPeriode,
    checkCurrentPeriode,
  };
}
