import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useDocuments() {
  const { mama_id } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocs = useCallback(async ({ search = "" } = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("documents")
      .select("*")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setDocs([]);
      return [];
    }
    setDocs(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  async function addDoc(values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("documents")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  async function updateDoc(id, values) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("documents")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  async function deleteDoc(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
  }

  return { docs, loading, error, fetchDocs, addDoc, updateDoc, deleteDoc };
}
