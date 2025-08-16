// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const defaults = {
  logo_url: "",
  primary_color: "#bfa14d",
  secondary_color: "#0f1c2e",
  email_envoi: "",
  email_alertes: "",
  dark_mode: false,
  langue: "fr",
  monnaie: "€",
  timezone: "Europe/Paris",
  rgpd_text: "",
  mentions_legales: "",
};

const localEnabledModules = {};
const localFeatureFlags = {};

export default function useMamaSettings() {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mama-settings', mamaId],
    enabled: !!mamaId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('mamas')
        .select(
          'logo_url, primary_color, secondary_color, email_envoi, email_alertes, dark_mode, langue, monnaie, timezone, rgpd_text, mentions_legales'
        )
        .eq('id', mamaId)
        .single()
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
  });

  const updateMamaSettings = useCallback(
    async (fields) => {
      if (!mamaId) return { error: 'missing mama_id' };
      const { data, error } = await supabase
        .from('mamas')
        .update(fields)
        .eq('id', mamaId)
        .select()
        .single();
      if (!error && data) {
        queryClient.setQueryData(['mama-settings', mamaId], (old) => ({
          ...(old || {}),
          ...data,
        }));
      }
      return { data, error };
    },
    [mamaId, queryClient]
  );

  const settings = { ...defaults, ...(query.data || {}) };
  const enabledModules = query.data?.enabled_modules ?? localEnabledModules;
  const featureFlags = query.data?.feature_flags ?? localFeatureFlags;

  return {
    settings,
    loading: query.isFetching,
    enabledModules,
    featureFlags,
    ok: !query.error,
    fetchMamaSettings: query.refetch,
    updateMamaSettings,
  };
}
