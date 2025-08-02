// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@/hooks/useAuth';

export function useFamillesWithSousFamilles() {
  const { mama_id } = useAuth();
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const [famRes, sousRes] = await Promise.all([
      supabase
        .from('familles')
        .select('id, nom, actif')
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true }),
      supabase
        .from('sous_familles')
        .select('id, nom, actif, famille_id')
        .eq('mama_id', mama_id),
    ]);
    if (famRes.error || sousRes.error) {
      setError(famRes.error || sousRes.error);
      setFamilles([]);
    } else {
      const grouped = (famRes.data || []).map((f) => ({
        ...f,
        sous_familles: (sousRes.data || []).filter((sf) => sf.famille_id === f.id),
      }));
      setFamilles(grouped);
    }
    setLoading(false);
  }, [mama_id]);

  async function addFamille(values) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('familles')
      .insert([{ ...values, mama_id }]);
    if (!error) await fetchAll();
    return { error };
  }

  async function updateFamille(id, values) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('familles')
      .update(values)
      .match({ id, mama_id });
    if (!error) await fetchAll();
    return { error };
  }

  async function deleteFamille(id) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('familles')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (!error) await fetchAll();
    return { error };
  }

  async function addSousFamille(famille_id, values) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('sous_familles')
      .insert([{ ...values, famille_id, mama_id }]);
    if (!error) await fetchAll();
    return { error };
  }

  async function updateSousFamille(id, values) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('sous_familles')
      .update(values)
      .match({ id, mama_id });
    if (!error) await fetchAll();
    return { error };
  }

  async function deleteSousFamille(id) {
    if (!mama_id) return { error: 'Aucun mama_id' };
    const { error } = await supabase
      .from('sous_familles')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (!error) await fetchAll();
    return { error };
  }

  async function toggleFamille(famille) {
    return updateFamille(famille.id, { nom: famille.nom, actif: !famille.actif });
  }

  async function toggleSousFamille(sf) {
    return updateSousFamille(sf.id, { nom: sf.nom, actif: !sf.actif });
  }

  return {
    familles,
    loading,
    error,
    fetchAll,
    addFamille,
    updateFamille,
    deleteFamille,
    addSousFamille,
    updateSousFamille,
    deleteSousFamille,
    toggleFamille,
    toggleSousFamille,
  };
}

export default useFamillesWithSousFamilles;
