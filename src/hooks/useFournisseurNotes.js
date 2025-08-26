// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useFournisseurNotes() {
  const { mama_id } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchNotes(fournisseur_id) {
    if (!mama_id) {
      setNotes([]);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('fournisseur_notes')
        .select(
          'id, note, date, created_at, updated_at, actif, fournisseur_id, mama_id'
        )
        .eq('mama_id', mama_id)
        .eq('fournisseur_id', fournisseur_id)
        .order('date', { ascending: false });

      if (error) throw error;
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erreur chargement des notes fournisseur.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  async function addNote(note) {
    if (!mama_id) return;
    const { error } = await supabase
      .from("fournisseur_notes")
      .insert([{ ...note, mama_id }]);
    if (error) throw error;
    // Optionnel: refetch
  }

  async function deleteNote(id) {
    if (!mama_id) return;
    const { error } = await supabase
      .from("fournisseur_notes")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) throw error;
    // Optionnel: refetch
  }

  return {
    notes,
    loading,
    error,
    fetchNotes,
    addNote,
    deleteNote,
  };
}
