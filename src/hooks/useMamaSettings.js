// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback, useEffect } from "react";
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

export default function useMamaSettings() {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [enabledModules, setEnabledModules] = useState(null);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [ok, setOk] = useState(true);

  const fetchMamaSettings = useCallback(async () => {
    if (!mamaId) {
      setLoading(false);
      return null;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("mamas")
      .select(
        "logo_url, primary_color, secondary_color, email_envoi, email_alertes, dark_mode, langue, monnaie, timezone, rgpd_text, mentions_legales, enabled_modules, feature_flags"
      )
      .eq("id", mamaId)
      .single();
    if (error?.code === '42703') {
      const { data: fallback, error: fbError } = await supabase
        .from('mamas')
        .select(
          "logo_url, primary_color, secondary_color, email_envoi, email_alertes, dark_mode, langue, monnaie, timezone, rgpd_text, mentions_legales"
        )
        .eq('id', mamaId)
        .single();
      setLoading(false);
      if (fbError) {
        console.warn('[useMamaSettings] fallback fetch failed', fbError);
        setSettings(defaults);
        setEnabledModules(null);
        setFeatureFlags(null);
        setOk(true);
        return null;
      }
      setSettings({ ...defaults, ...fallback });
      setEnabledModules(null);
      setFeatureFlags(null);
      setOk(true);
      return fallback;
    }
    setLoading(false);
    if (error) {
      console.warn("[useMamaSettings] fetch failed", error);
      setSettings(defaults);
      setEnabledModules(null);
      setFeatureFlags(null);
      setOk(true);
      return null;
    }
    setSettings({ ...defaults, ...data });
    setEnabledModules(data.enabled_modules || null);
    setFeatureFlags(data.feature_flags || null);
    setOk(true);
    return data;
  }, [mamaId]);

  const updateMamaSettings = useCallback(
    async (fields) => {
      if (!mamaId) return { error: "missing mama_id" };
      setLoading(true);
      const { data, error } = await supabase
        .from("mamas")
        .update(fields)
        .eq("id", mamaId)
        .select()
        .single();
      setLoading(false);
      if (!error && data) setSettings((s) => ({ ...s, ...data }));
      return { data, error };
    },
    [mamaId]
  );

  useEffect(() => {
    fetchMamaSettings();
  }, [fetchMamaSettings]);

  return {
    settings,
    loading,
    enabledModules,
    featureFlags,
    ok,
    fetchMamaSettings,
    updateMamaSettings,
  };
}
