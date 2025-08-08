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

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("templates_commandes")
      .select("*")
      .order("nom");
    setTemplates(data || []);
    setLoading(false);
  };

  const saveTemplate = async template => {
    const { error } = await supabase
      .from("templates_commandes")
      .upsert(template)
      .select();
    if (!error) fetchTemplates();
    return { error };
  };

  const toggleActif = async (id, actif) => {
    const { error } = await supabase
      .from("templates_commandes")
      .update({ actif })
      .eq("id", id);
    if (!error) fetchTemplates();
    return { error };
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { templates, loading, fetchTemplates, saveTemplate, toggleActif };
}
