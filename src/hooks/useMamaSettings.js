// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCallback, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { deduceEnabledModulesFromRights } from '@/lib/access';

function safeQueryClient() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryClient();
  } catch {
    return {
      invalidateQueries: () => {},
      setQueryData: () => {},
      fetchQuery: async () => {},
    };
  }
}

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

export const useMamaSettings = () => {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const queryClient = safeQueryClient();

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

  const settings = useMemo(() => ({ ...defaults, ...(query.data || {}) }), [query.data]);

  const fallbackModules = useMemo(
    () => deduceEnabledModulesFromRights(userData?.access_rights),
    [userData?.access_rights]
  );

  const enabledModules = useMemo(() => {
    const em = query.data?.enabled_modules;
    if (em && Object.keys(em).length > 0) return em;
    if (Object.keys(fallbackModules).length > 0) return fallbackModules;
    return localEnabledModules;
  }, [query.data?.enabled_modules, fallbackModules]);
  const featureFlags = useMemo(
    () => query.data?.feature_flags ?? localFeatureFlags,
    [query.data?.feature_flags]
  );

  return {
    mamaId,
    settings,
    loading: query.isFetching,
    enabledModules,
    featureFlags,
    ok: !query.error,
    fetchMamaSettings: query.refetch,
    updateMamaSettings,
  };
};

