// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import PageWrapper from "@/components/ui/PageWrapper";
import GlassCard from "@/components/ui/GlassCard";
import MamaLogo from "@/components/ui/MamaLogo";
import toast from "react-hot-toast";

export default function CreateMama() {
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const { mama_id, auth_id, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mama_id) navigate("/dashboard");
  }, [mama_id, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: mama, error } = await supabase
        .from("mamas")
        .insert({ nom })
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from("utilisateurs")
        .update({ mama_id: mama.id })
        .eq("auth_id", auth_id);
      await refreshUser();
      navigate("/onboarding");
    } catch (err) {
      if (err?.message) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <GlassCard className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <MamaLogo width={80} className="mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white">Votre établissement</h1>
          </div>
          <div>
            <label className="block text-sm text-white mb-1">Nom du restaurant</label>
            <input
              className="w-full rounded border border-white/30 bg-white/20 py-2 px-3 text-white placeholder-white/70"
              value={nom}
              onChange={e => setNom(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full py-2 rounded bg-mamastockGold text-mamastockBg font-semibold hover:bg-mamastockGoldHover transition"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Valider"}
          </button>
        </form>
      </GlassCard>
    </PageWrapper>
  );
}
