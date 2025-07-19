import { useState } from "react";
import { getSupabaseClient } from "@/api/shared/supabaseClient.js";
import { useAuth } from "@/context/AuthContext";

export function useConsentements() {
  const { user_id, mama_id } = useAuth();
  const [consentements, setConsentements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  async function fetchConsentements() {
    if (!user_id || !mama_id) return [];
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("consentements_utilisateur")
      .select("*")
      .eq("utilisateur_id", user_id)
      .eq("mama_id", mama_id)
      .order("date_consentement", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      setLoaded(true);
      return [];
    }
    setConsentements(Array.isArray(data) ? data : []);
    setLoaded(true);
    return data || [];
  }

  async function enregistrerConsentement(type_consentement, donne) {
    if (!user_id || !mama_id) return { error: "no user" };
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("consentements_utilisateur")
      .insert([
        {
          utilisateur_id: user_id,
          mama_id,
          type_consentement,
          donne,
          date_consentement: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    await fetchConsentements();
    return { data };
  }

  return {
    consentements,
    loading,
    error,
    loaded,
    fetchConsentements,
    enregistrerConsentement,
  };
}

export default useConsentements;
