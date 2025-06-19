import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useOnboarding() {
  const { mama_id, user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchProgress();
    // fetchProgress has stable identity
  }, [user?.id]);

  async function fetchProgress() {
    setLoading(true);
    const { data, error } = await supabase
      .from("onboarding_progress")
      .select("step")
      .eq("user_id", user.id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) {
      console.error("Erreur progression onboarding", error);
      setError("Erreur chargement");
    } else if (data) {
      setStep(data.step);
      setError(null);
    }
  }

  async function saveStep(nextStep) {
    setStep(nextStep);
    const { error } = await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, mama_id, step: nextStep });
    if (error) {
      console.error("Erreur sauvegarde onboarding", error);
      setError("Sauvegarde échouée");
    } else {
      setError(null);
    }
  }
  return { step, loading, error, fetchProgress, saveStep };
}
