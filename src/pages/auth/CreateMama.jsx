// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from "@/components/ui/PageWrapper";
import GlassCard from "@/components/ui/GlassCard";
import MamaLogo from "@/components/ui/MamaLogo";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/ui/PrimaryButton";
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
      toast.success("Établissement créé");
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
            <Input
              className="w-full"
              value={nom}
              onChange={e => setNom(e.target.value)}
              required
              placeholder="Nom du restaurant"
            />
          </div>
          <PrimaryButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Valider"}
          </PrimaryButton>
        </form>
      </GlassCard>
    </PageWrapper>
  );
}
