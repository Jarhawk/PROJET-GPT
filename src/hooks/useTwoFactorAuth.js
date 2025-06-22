import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { authenticator } from "otplib";

export function useTwoFactorAuth() {
  const [secret, setSecret] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("two_factor_auth")
      .select("enabled, secret")
      .eq("id", userData.user.id)
      .single();
    if (error) setError(error);
    else {
      setEnabled(data.enabled);
      setSecret(data.secret);
    }
    setLoading(false);
  }

  function startSetup() {
    const newSecret = authenticator.generateSecret();
    setSecret(newSecret);
    setEnabled(false);
    return newSecret;
  }

  async function finalizeSetup() {
    if (!secret) return;
    setLoading(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("two_factor_auth")
      .upsert({ id: userData.user.id, secret, enabled: true });
    if (error) setError(error);
    else setEnabled(true);
    setLoading(false);
  }

  async function disable() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("two_factor_auth")
      .update({ enabled: false, secret: null })
      .eq("id", userData.user.id);
    if (error) setError(error);
    else {
      setSecret(null);
      setEnabled(false);
    }
    setLoading(false);
  }

  function verify(code) {
    if (!secret) return false;
    try {
      return authenticator.check(code, secret);
    } catch {
      return false;
    }
  }

  return {
    secret,
    enabled,
    loading,
    error,
    refresh,
    startSetup,
    finalizeSetup,
    disable,
    verify,
  };
}
