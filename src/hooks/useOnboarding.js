// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useOnboarding() {
  const { mama_id, user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !mama_id) return;
    fetchProgress();
  }, [user?.id, mama_id]);

  async function fetchProgress() {
    if (!user || !mama_id) return [];
    setLoading(true);
    const { data } = await supabase
      .from("etapes_onboarding")
      .select("etape, statut")
      .eq("user_id", user.id)
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
    if (!user || !mama_id) return;
    setStep(0);
    await supabase.from("etapes_onboarding").insert([
      { user_id: user.id, mama_id, etape: "0", statut: "en cours" },
    ]);
  }

  async function nextStep() {
    if (!user || !mama_id) return;
    const next = step + 1;
    setStep(next);
    await supabase.from("etapes_onboarding").insert([
      { user_id: user.id, mama_id, etape: String(next), statut: "en cours" },
    ]);
  }

  async function skip() {
    if (!user || !mama_id) return;
    await supabase.from("etapes_onboarding").insert([
      { user_id: user.id, mama_id, etape: String(step), statut: "sauté" },
    ]);
  }

  async function complete() {
    if (!user || !mama_id) return;
    await supabase.from("etapes_onboarding").insert([
      { user_id: user.id, mama_id, etape: String(step), statut: "terminé" },
    ]);
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
