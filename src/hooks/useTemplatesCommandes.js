// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export async function getTemplatesCommandesActifs() {
  const { data, error } = await supabase
    .from("templates_commandes")
    .select("*")
    .eq("actif", true)
    .order("nom");
  return { data, error };
}

export default function useTemplatesCommandes() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("templates_commandes")
      .select("*")
      .order("nom");
    if (error) {
      setError(error);
      setTemplates([]);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
    return { data, error };
  };

  const saveTemplate = async (template) => {
    setError(null);
    const { error } = await supabase
      .from("templates_commandes")
      .upsert(template)
      .select();
    if (error) {
      setError(error);
    } else {
      fetchTemplates();
    }
    return { error };
  };

  const toggleActif = async (id, actif) => {
    setError(null);
    const { error } = await supabase
      .from("templates_commandes")
      .update({ actif })
      .eq("id", id);
    if (error) {
      setError(error);
    } else {
      fetchTemplates();
    }
    return { error };
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    data: templates,
    templates,
    loading,
    error,
    fetchTemplates,
    saveTemplate,
    toggleActif,
  };
}
