// src/hooks/useFournisseurNotes.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useFournisseurNotes(fournisseurId) {
  const { mama_id } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = async () => {
    if (!fournisseurId || !mama_id) return;
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("fournisseur_notes")
      .select("*")
      .eq("fournisseur_id", fournisseurId)
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur fetchNotes:", error);
      setError("Impossible de charger les notes");
    } else {
      setNotes(data);
    }

    setLoading(false);
  };

  const addNote = async (note) => {
    if (!mama_id || !fournisseurId) return;
    const { error } = await supabase
      .from("fournisseur_notes")
      .insert([{ fournisseur_id: fournisseurId, note, mama_id }]);

    if (error) {
      console.error("Erreur addNote:", error);
      throw error;
    } else {
      await fetchNotes();
    }
  };

  const deleteNote = async (noteId) => {
    if (!noteId || !mama_id) return;
    const { error } = await supabase
      .from("fournisseur_notes")
      .delete()
      .eq("id", noteId)
      .eq("mama_id", mama_id); // sécurité RLS

    if (error) {
      console.error("Erreur deleteNote:", error);
      throw error;
    } else {
      await fetchNotes();
    }
  };

  useEffect(() => {
    if (fournisseurId && mama_id) {
      fetchNotes();
    }
  }, [fournisseurId, mama_id]);

  return { notes, loading, error, fetchNotes, addNote, deleteNote };
}
