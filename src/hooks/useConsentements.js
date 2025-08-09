import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import useAuth from "@/hooks/useAuth";

export default function useConsentements() {
  const { user_id, mama_id } = useAuth();
  const [consentements, setConsentements] = useState([]);
  const supabase = createClient();

  const fetchConsentements = useCallback(
    async (utilisateurId = user_id) => {
      if (!supabase || !mama_id || !utilisateurId) return [];
      const { data, error } = await supabase
        .from("consentements_utilisateur")
        .select("*")
        .eq("mama_id", mama_id)
        .eq("utilisateur_id", utilisateurId)
        .order("date_consentement", { ascending: false });
      if (error) {
        console.error("Erreur chargement consentements:", error);
      }
      setConsentements(data || []);
      return data || [];
    },
    [supabase, mama_id, user_id]
  );

  useEffect(() => {
    fetchConsentements();
  }, [fetchConsentements]);

  return { consentements, fetchConsentements };
}
