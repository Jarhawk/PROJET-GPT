// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback, useEffect } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

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
  const { mama_id } = useAuth();
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [enabledModules, setEnabledModules] = useState(null);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [ok, setOk] = useState(true);

  const fetchMamaSettings = useCallback(async () => {
    if (!mama_id) {
      setLoading(false);
      return null;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("mamas")
      .select(
        "logo_url, primary_color, secondary_color, email_envoi, email_alertes, dark_mode, langue, monnaie, timezone, rgpd_text, mentions_legales, enabled_modules, feature_flags"
      )
      .eq("id", mama_id)
      .single();
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
  }, [mama_id]);

  const updateMamaSettings = useCallback(
    async (fields) => {
      if (!mama_id) return { error: "missing mama_id" };
      setLoading(true);
      const { data, error } = await supabase
        .from("mamas")
        .update(fields)
        .eq("id", mama_id)
        .select()
        .single();
      setLoading(false);
      if (!error && data) setSettings((s) => ({ ...s, ...data }));
      return { data, error };
    },
    [mama_id]
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
