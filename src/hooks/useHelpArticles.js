import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useHelpArticles() {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchArticles() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("help_articles")
      .select("*")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error.message || error);
      setItems([]);
      return [];
    }
    setItems(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function addArticle(values) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("help_articles")
      .insert([{ ...values, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchArticles();
  }

  async function updateArticle(id, values) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("help_articles")
      .update(values)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchArticles();
  }

  async function deleteArticle(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("help_articles")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return;
    }
    await fetchArticles();
  }

  return {
    items,
    loading,
    error,
    fetchArticles,
    addArticle,
    updateArticle,
    deleteArticle,
  };
}
