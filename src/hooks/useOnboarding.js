// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useOnboarding() {
  const { mama_id } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mama_id) return;
    fetchProgress();
  }, [mama_id]);

  async function fetchProgress() {
    if (!mama_id) return [];
    setLoading(true);
    const { data } = await supabase
      .from("etapes_onboarding")
      .select("etape, terminee")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (data && data.length) {
      const last = data[data.length - 1];
      setStep(parseInt(last.etape, 10));
    }
    return data || [];
  }

  async function startOnboarding() {
    if (!mama_id) return;
    setStep(0);
    await supabase
      .from("etapes_onboarding")
      .insert([{ mama_id, etape: "0", terminee: false }]);
  }

  async function nextStep() {
    if (!mama_id) return;
    const next = step + 1;
    setStep(next);
    await supabase
      .from("etapes_onboarding")
      .insert([{ mama_id, etape: String(next), terminee: false }]);
  }

  async function skip() {
    if (!mama_id) return;
    await supabase
      .from("etapes_onboarding")
      .insert([{ mama_id, etape: String(step), terminee: true }]);
  }

  async function complete() {
    if (!mama_id) return;
    await supabase
      .from("etapes_onboarding")
      .insert([{ mama_id, etape: String(step), terminee: true }]);
  }

  return {
    step,
    loading,
    fetchProgress,
    startOnboarding,
    nextStep,
    skip,
    complete,
  };
}
