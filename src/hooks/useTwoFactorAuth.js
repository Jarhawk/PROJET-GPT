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
      .from("users")
      .select("two_fa_enabled, two_fa_secret")
      .eq("id", userData.user.id)
      .single();
    if (error) setError(error);
    else {
      setEnabled(data.two_fa_enabled);
      setSecret(data.two_fa_secret);
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
    const { error } = await supabase.rpc("enable_two_fa", { p_secret: secret });
    if (error) setError(error);
    else setEnabled(true);
    setLoading(false);
  }

  async function disable() {
    setLoading(true);
    const { error } = await supabase.rpc("disable_two_fa");
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
