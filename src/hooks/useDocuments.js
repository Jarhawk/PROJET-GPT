// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";

export function useDocuments() {
  const { mama_id } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listDocuments = useCallback(async (filters = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("documents")
      .select("id, chemin, type, mama_id, created_at")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.search) {
      query = query.ilike("chemin", `%${filters.search}%`);
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setDocuments([]);
      return [];
    }
    const rows = [];
    if (Array.isArray(data)) {
      for (const d of data) {
        rows.push({ ...d, url: d.chemin });
      }
    }
    setDocuments(rows);
    return rows;
  }, [mama_id]);

  const uploadDocument = useCallback(
    async (file) => {
      if (!mama_id || !file) return { error: "Aucun fichier" };
      setLoading(true);
      setError(null);
      try {
        const url = await uploadFile("mamastock-documents", file, "misc");
        const { data, error } = await supabase
          .from("documents")
          .insert([{ chemin: url, type: file.type, mama_id }])
          .select("id, chemin, type, mama_id, created_at")
          .single();
        setLoading(false);
        if (error) {
          setError(error.message || error);
          return { error };
        }
        const row = { ...data, url: data.chemin };
        setDocuments((d) => (Array.isArray(d) ? [row, ...d] : [row]));
        return { data: row };
      } catch (err) {
        setLoading(false);
        setError(err.message || err);
        return { error: err };
      }
    },
    [mama_id]
  );

  const getDocumentUrl = useCallback(
    async (id) => {
      if (!id || !mama_id) return null;
      const { data, error } = await supabase
        .from("documents")
        .select("chemin")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      if (error) {
        setError(error.message || error);
        return null;
      }
      return data?.chemin || null;
    },
    [mama_id]
  );

  const deleteDocument = useCallback(
    async (id) => {
      if (!id || !mama_id) return { error: "Aucun id" };
      setLoading(true);
      setError(null);
      const { data: doc, error: fetchError } = await supabase
        .from("documents")
        .select("chemin")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      if (fetchError) {
        setLoading(false);
        setError(fetchError.message || fetchError);
        return { error: fetchError };
      }
      const path = pathFromUrl(doc.chemin);
      try {
        await deleteFile("mamastock-documents", path);
      } catch {
        /* ignore */
      }
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("mama_id", mama_id);
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return { error };
      }
      setDocuments((d) => {
        const list = Array.isArray(d) ? d : [];
        const next = [];
        for (const doc of list) {
          if (doc.id !== id) next.push(doc);
        }
        return next;
      });
      return { success: true };
    },
    [mama_id]
  );

  return {
    documents,
    loading,
    error,
    listDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
  };
}
