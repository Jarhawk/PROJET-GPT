import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageWrapper from "@/components/ui/PageWrapper";
import GlassCard from "@/components/ui/GlassCard";

export default function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.signOut().then(() => {
      toast.success("Déconnecté");
      navigate("/login");
    });
  }, [navigate]);
  return (
    <PageWrapper>
      <GlassCard className="text-center">Déconnexion…</GlassCard>
    </PageWrapper>
  );
}
