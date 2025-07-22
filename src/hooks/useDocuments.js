// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
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
      .select("*")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (filters.entite_liee_type)
      query = query.eq("entite_liee_type", filters.entite_liee_type);
    if (filters.entite_liee_id)
      query = query.eq("entite_liee_id", filters.entite_liee_id);
    if (filters.categorie) query = query.eq("categorie", filters.categorie);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.search) {
      query = query.or(
        `nom.ilike.%${filters.search}%,titre.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setDocuments([]);
      return [];
    }
    setDocuments(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  const uploadDocument = useCallback(
    async (file, metadata = {}) => {
      if (!mama_id || !file) return { error: "Aucun fichier" };
      setLoading(true);
      setError(null);
      try {
        const folder = metadata.entite_liee_type
          ? `${metadata.entite_liee_type}s`
          : "misc";
        const url = await uploadFile("mamastock-documents", file, folder);
        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              nom: file.name,
              type: file.type,
              taille: file.size,
              categorie: metadata.categorie || null,
              url,
              fichier_url: url,
              titre: metadata.titre || file.name,
              commentaire: metadata.commentaire || null,
              entite_liee_type: metadata.entite_liee_type || null,
              entite_liee_id: metadata.entite_liee_id || null,
              mama_id,
            },
          ])
          .select()
          .single();
        setLoading(false);
        if (error) {
          setError(error.message || error);
          return { error };
        }
        setDocuments((d) => [data, ...d]);
        return { data };
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
        .select("fichier_url, url")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      if (error) {
        setError(error.message || error);
        return null;
      }
      return data?.fichier_url || data?.url || null;
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
        .select("fichier_url, url")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      if (fetchError) {
        setLoading(false);
        setError(fetchError.message || fetchError);
        return { error: fetchError };
      }
      const path = pathFromUrl(doc.fichier_url || doc.url);
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
      setDocuments((d) => d.filter((doc) => doc.id !== id));
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
