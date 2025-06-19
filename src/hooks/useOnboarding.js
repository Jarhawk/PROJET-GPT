import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useOnboarding() {
  const { mama_id, user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProgress();
    // fetchProgress has stable identity
  }, [user?.id]);

  async function fetchProgress() {
    setLoading(true);
    const { data } = await supabase
      .from("onboarding_progress")
      .select("step")
      .eq("user_id", user.id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (data) setStep(data.step);
  }

  async function saveStep(nextStep) {
    setStep(nextStep);
    await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, mama_id, step: nextStep });
  }

  return { step, loading, fetchProgress, saveStep };
}
