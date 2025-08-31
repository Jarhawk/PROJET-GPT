import { useEffect, useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useConsentements() {
  const { user_id, mama_id } = useAuth();
  const [consentements, setConsentements] = useState([]);

  const fetchConsentements = useCallback(
    async (utilisateurId = user_id) => {
      if (!supabase || !mama_id || !utilisateurId) return [];
      const { data, error } = await supabase
        .from('consentements_utilisateur')
        .select('id, user_id, mama_id, consentement, date_consentement, actif, created_at, utilisateur_id, type_consentement')
        .eq('mama_id', mama_id)
        .eq('utilisateur_id', utilisateurId)
        .order('date_consentement', { ascending: false });
      if (error) {
        console.error('Erreur chargement consentements:', error);
      }
      const rows = Array.isArray(data) ? data : [];
      setConsentements(rows);
      return rows;
    },
    [mama_id, user_id]
  );

  useEffect(() => {
    fetchConsentements();
  }, [fetchConsentements]);

  return { consentements, fetchConsentements };
}
